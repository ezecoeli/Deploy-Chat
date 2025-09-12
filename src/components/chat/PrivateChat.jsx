import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useEncryption } from '../../hooks/useEncryption';
import MessageArea from './MessageArea';
import MessageInput from './MessageInput';
import { useTranslation } from '../../hooks/useTranslation';

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

    // function to load messages for the conversation
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

    // Load messages when the conversation is ready
    useEffect(() => {
        if (conversationKey && conversation?.id) {
            loadMessages();
        }
    }, [conversationKey, conversation?.id]);

    // Subscribe to new messages in real-time
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
                // Get complete user information who sent the message
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

    // Initialize encrypted conversation
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

                // Check for existing conversation key
                const { data: existingKey, error: fetchError } = await supabase
                    .from('conversation_keys')
                    .select('encrypted_conversation_key')
                    .eq('channel_id', conversation.id)
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!isMounted) return;

                // Handle fetch errors (406 might be expected if no keys exist)
                if (fetchError && fetchError.code !== 'PGRST116') {
                    console.warn('Error fetching conversation key:', fetchError);
                    // Continue to create new key instead of throwing
                }

                let aesKey = null;

                // Try to decrypt existing key
                if (existingKey?.encrypted_conversation_key && !fetchError) {
                    try {
                        console.log(' Decrypting existing conversation key...');
                        aesKey = await decryptKeyFromUser(
                            existingKey.encrypted_conversation_key,
                            userKeyPair.privateKey
                        );
                        console.log(' Successfully decrypted existing conversation key');
                    } catch (decryptError) {
                        console.warn(' Failed to decrypt existing key, will create new one:', decryptError);

                        // Remove corrupted key
                        try {
                            await supabase
                                .from('conversation_keys')
                                .delete()
                                .eq('channel_id', conversation.id)
                                .eq('user_id', user.id);
                            console.log(' Removed corrupted key');
                        } catch (deleteError) {
                            console.warn('Could not delete corrupted key:', deleteError);
                        }
                    }
                }

                // Create new conversation key if none exists or decryption failed
                if (!aesKey && isMounted) {
                    console.log('Creating new conversation key...');

                    try {
                        // Generate new symmetric key for conversation
                        aesKey = await generateConversationKey();

                        const otherUserId = conversation.participant_1 === user.id
                            ? conversation.participant_2
                            : conversation.participant_1;

                        // Get other user's public key
                        const otherUserPublicKey = await getUserPublicKey(otherUserId);

                        // Encrypt key for both users
                        const encryptedKeyForMe = await encryptKeyForUser(aesKey, userKeyPair.publicKey);
                        const encryptedKeyForOther = await encryptKeyForUser(aesKey, otherUserPublicKey);

                        // Insert keys for both users with conflict handling
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
                                if (insertError.code === '23505') {
                                    console.log(` Key already exists for user ${keyData.user_id}, skipping...`);
                                } else {
                                    console.error('Error inserting conversation key:', insertError);
                                    throw insertError;
                                }
                            }
                        }

                        console.log(' Created conversation keys for both users');

                    } catch (keyCreationError) {
                        console.error('Error creating conversation key:', keyCreationError);

                        // Fallback: try to get existing key one more time
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
                                console.log('Retrieved conversation key from fallback');
                            }
                        } catch (fallbackError) {
                            console.error('Fallback key retrieval failed:', fallbackError);
                            throw keyCreationError;
                        }
                    }
                }

                if (isMounted && aesKey) {
                    setConversationKey(aesKey);
                    console.log('Encrypted conversation ready');
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

        // Debounce initialization to prevent multiple calls
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

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Load user profile
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
                    console.warn('Error loading user profile:', error);
                    // Fallback 
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
                console.error('Error loading user profile:', err);
                // Fallback 
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
            console.warn('No conversation key available for decryption');
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
            {/* Header */}
            <div className="p-4 border-b border-gray-600 flex items-center gap-3">
                <div>
                    <h2 
                        className="font-semibold"
                        style={{ color: theme?.colors?.text || '#ffffff' }} 
                    >
                        {getOtherParticipant()}
                    </h2>
                    <p 
                        className="text-xs flex items-center gap-1"
                        style={{ 
                            color: theme?.colors?.accent || theme?.colors?.textSecondary || '#00ff00', 
                            opacity: 0.8
                        }}
                    >
                        {t('privateChat')} 
                    </p>
                </div>
            </div>

            {/* Message Area */}
            <MessageArea
                messages={messages}
                user={user}
                theme={theme}
                currentTheme={currentTheme}
                typingUsers={[]}
                t={(key) => key}
                onDecryptMessage={handleDecryptMessage}
            />

            {/* Message Input */}
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