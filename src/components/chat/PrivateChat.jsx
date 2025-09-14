import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useEncryption } from '../../hooks/useEncryption';
import MessageArea from './MessageArea';
import MessageInput from './MessageInput';
import { useTranslation } from '../../hooks/useTranslation';
import { getAvatarById } from '../../config/avatars';

export default function PrivateChat({
    conversation,
    user,
    theme,
    currentTheme,
    onBack,
    onError,
}) {
    const { t } = useTranslation();
    const [conversationKey, setConversationKey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const isMountedRef = useRef(true);

    const {
        userKeyPair,
        isKeysReady,
        getUserPublicKey,
        encryptMessage,
        decryptMessage,
        generateConversationKey,
        encryptKeyForUser,
        decryptKeyFromUser
    } = useEncryption(user);

    const loadMessages = async () => {
        if (!conversation?.id) return;

        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
          *,
          users:user_id (
            id,
            email,
            username,
            avatar_url
          )
        `)
                .eq('channel_id', conversation.id)
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) throw error;
            setMessages(data || []);
        } catch (err) {
            console.error('Error loading private messages:', err);
            setMessages([]);
        }
    };

    useEffect(() => {
        if (conversationKey && conversation?.id) {
            loadMessages();
        }
    }, [conversationKey, conversation?.id]);

    useEffect(() => {
        if (!conversation?.id || !conversationKey) return;

        const subscription = supabase
            .channel(`private_messages:${conversation.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `channel_id=eq.${conversation.id}`
            }, async (payload) => {
                let messageWithUser = { ...payload.new };

                try {
                    const { data: userData, error } = await supabase
                        .from('users')
                        .select('id, email, username, avatar_url')
                        .eq('id', payload.new.user_id)
                        .single();

                    if (!error && userData) {
                        messageWithUser.users = userData;
                    } else {
                        messageWithUser.users = {
                            id: payload.new.user_id,
                            email: 'unknown_user',
                            username: 'unknown_user',
                            avatar_url: 'avatar-01'
                        };
                    }
                } catch (err) {
                    messageWithUser.users = {
                        id: payload.new.user_id,
                        email: 'unknown_user',
                        username: 'unknown_user',
                        avatar_url: 'avatar-01'
                    };
                }

                setMessages(current => {
                    const messageExists = current.some(msg => msg.id === payload.new.id);
                    if (messageExists) return current;
                    return [...current, messageWithUser];
                });
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [conversation?.id, conversationKey]);

    useEffect(() => {
        isMountedRef.current = true;

        if (!conversation?.id || !userKeyPair || !isKeysReady) {
            setLoading(true);
            return;
        }

        let initTimeout;
        let isMounted = true;

        const initializeEncryptedConversation = async () => {
            if (!isMounted) return;

            try {
                setLoading(true);
                setError(null);

                const { data: existingKey, error: fetchError } = await supabase
                    .from('conversation_keys')
                    .select('encrypted_conversation_key')
                    .eq('channel_id', conversation.id)
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!isMounted) return;

                if (fetchError && fetchError.code !== 'PGRST116') {
                    // Continue to create new key instead of throwing
                }

                let aesKey = null;

                if (existingKey?.encrypted_conversation_key && !fetchError) {
                    try {
                        aesKey = await decryptKeyFromUser(
                            existingKey.encrypted_conversation_key,
                            userKeyPair.privateKey
                        );
                    } catch (decryptError) {
                        try {
                            await supabase
                                .from('conversation_keys')
                                .delete()
                                .eq('channel_id', conversation.id)
                                .eq('user_id', user.id);
                        } catch (deleteError) {
                            // Silent error handling
                        }
                    }
                }

                if (!aesKey && isMounted) {
                    try {
                        aesKey = await generateConversationKey();

                        const otherUserId = conversation.participant_1 === user.id
                            ? conversation.participant_2
                            : conversation.participant_1;

                        const otherUserPublicKey = await getUserPublicKey(otherUserId);

                        const encryptedKeyForMe = await encryptKeyForUser(aesKey, userKeyPair.publicKey);
                        const encryptedKeyForOther = await encryptKeyForUser(aesKey, otherUserPublicKey);

                        const insertOperations = [
                            {
                                channel_id: conversation.id,
                                user_id: user.id,
                                encrypted_conversation_key: encryptedKeyForMe,
                                key_version: 1
                            },
                            {
                                channel_id: conversation.id,
                                user_id: otherUserId,
                                encrypted_conversation_key: encryptedKeyForOther,
                                key_version: 1
                            }
                        ];

                        for (const keyData of insertOperations) {
                            try {
                                const { error: insertError } = await supabase
                                    .from('conversation_keys')
                                    .upsert(keyData, {
                                        onConflict: 'channel_id,user_id,key_version'
                                    });

                                if (insertError && insertError.code !== '23505') {
                                    throw insertError;
                                }
                            } catch (insertError) {
                                if (insertError.code !== '23505') {
                                    console.error('Error inserting conversation key:', insertError);
                                    throw insertError;
                                }
                            }
                        }

                    } catch (keyCreationError) {
                        console.error('Error creating conversation key:', keyCreationError);

                        try {
                            const { data: fallbackKey } = await supabase
                                .from('conversation_keys')
                                .select('encrypted_conversation_key')
                                .eq('channel_id', conversation.id)
                                .eq('user_id', user.id)
                                .single();

                            if (fallbackKey && isMounted) {
                                aesKey = await decryptKeyFromUser(
                                    fallbackKey.encrypted_conversation_key,
                                    userKeyPair.privateKey
                                );
                            }
                        } catch (fallbackError) {
                            throw keyCreationError;
                        }
                    }
                }

                if (isMounted && aesKey) {
                    setConversationKey(aesKey);
                }

            } catch (error) {
                console.error('Error initializing encrypted conversation:', error);
                if (isMounted) {
                    setError('Error setting up encrypted conversation: ' + error.message);
                    onError?.('Error setting up encrypted conversation: ' + error.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        initTimeout = setTimeout(() => {
            if (isMounted) {
                initializeEncryptedConversation();
            }
        }, 200);

        return () => {
            isMounted = false;
            if (initTimeout) {
                clearTimeout(initTimeout);
            }
        };
    }, [conversation?.id, userKeyPair, isKeysReady, user?.id, getUserPublicKey, onError]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const loadUserProfile = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, email, username, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    setUserProfile({
                        id: user.id,
                        username: user.email?.split('@')[0] || 'Unknown',
                        email: user.email,
                        avatar_url: 'avatar-01'
                    });
                } else {
                    setUserProfile({
                        id: data.id,
                        username: data.username || data.email?.split('@')[0] || 'Unknown',
                        email: data.email,
                        avatar_url: data.avatar_url || 'avatar-01'
                    });
                }
            } catch (err) {
                setUserProfile({
                    id: user.id,
                    username: user.email?.split('@')[0] || 'Unknown',
                    email: user.email,
                    avatar_url: 'avatar-01'
                });
            }
        };

        loadUserProfile();
    }, [user?.id]);

    const handleSendMessage = async (messageContent) => {
        if (!conversationKey) {
            throw new Error('Conversation not ready for encryption');
        }

        try {
            const encryptedContent = await encryptMessage(messageContent, conversationKey);

            const { data, error } = await supabase
                .from('messages')
                .insert({
                    content: encryptedContent,
                    channel_id: conversation.id,
                    user_id: user.id,
                    is_encrypted: true
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error sending encrypted message:', error);
            throw error;
        }
    };

    const handleDecryptMessage = async (encryptedMessage) => {
        if (!conversationKey) {
            return '[Encrypted message - key not available]';
        }

        try {
            return await decryptMessage(encryptedMessage, conversationKey);
        } catch (error) {
            console.error('Error decrypting message:', error);
            return '[Failed to decrypt message]';
        }
    };

    const getOtherParticipant = () => {
        if (!conversation.participant_1 || !conversation.participant_2) return 'Unknown';

        if (conversation.otherUser) {
            return conversation.otherUser.username || conversation.otherUser.email?.split('@')[0] || 'Unknown User';
        }

        return 'Private Chat';
    };

    const handleTypingChange = (isTyping) => {
        // implement if needed
    };

    const otherUser = conversation.otherUser || {
        username: 'Usuario',
        avatar_url: 'avatar-01'
    };

    const avatarSrc = getAvatarById(otherUser.avatar_url)?.src || '/assets/avatars/avatar-01.png';

    if (!conversation || !user) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <p className="mb-4">Loading conversation...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-sm opacity-70">Setting up encrypted conversation...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-red-400">
                    <p className="mb-4">Error setting up encrypted conversation</p>
                    <p className="text-sm opacity-70">{error}</p>
                    <button
                        onClick={onBack}
                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!conversationKey) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <p className="mb-4">Unable to establish encrypted conversation</p>
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-600 flex items-center gap-3">
                <img
                    src={avatarSrc}
                    alt={otherUser.username}
                    className="w-8 h-8 rounded-full object-cover bg-gray-700"
                />
                <div>
                    <h2 
                    className="font-semibold"
                    style={{ color: theme?.colors?.text || '#ffffff' }} 
                    >
                    {otherUser.username}
                    </h2>
                    
                </div>
            </div>

            <MessageArea
                messages={messages}
                user={user}
                theme={theme}
                currentTheme={currentTheme}
                typingUsers={[]}
                t={(key) => key}
                onDecryptMessage={handleDecryptMessage}
            />

            <MessageInput
                currentChannel={conversation}
                user={user}
                userProfile={userProfile}
                theme={theme}
                currentTheme={currentTheme}
                t={t}
                onError={onError}
                onTypingChange={handleTypingChange}
                onSendMessage={handleSendMessage}
                isEncrypted={true}
            />
        </div>
    );
}