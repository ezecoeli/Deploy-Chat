import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../utils/supabaseClient';
import MessageArea from './MessageArea';
import MessageInput from './MessageInput';
import { useTranslation } from '../../hooks/useTranslation';
import { usePinnedMessages } from '../../hooks/usePinnedMessages';
import { usePermissions } from '../../hooks/usePermissions';
import PinnedMessagesBar from './PinnedMessagesBar';

export default function PrivateChat({
    conversation,
    user,
    theme,
    currentTheme,
    onError,
    checkForNewMentions
}) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const isMountedRef = useRef(true);
    const { isAdmin, isModerator } = usePermissions(user);
    const canPin = isAdmin || isModerator;

    const { 
        pinnedMessages, 
        pinMessage, 
        unpinMessage, 
        canPinMore 
    } = usePinnedMessages(conversation?.id, user);

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
            setMessages([]);
        }
    };

    const handlePinMessage = useCallback(async (message) => {
        try {
            if (message.is_pinned) {
                await unpinMessage(message.id);
            } else {
                if (!canPinMore) {
                    return;
                }
                await pinMessage(message.id, message.user_id);
            }
        } catch (error) {
            // Error handled by usePinnedMessages hook
        }
    }, [pinMessage, unpinMessage, canPinMore]);

    useEffect(() => {
        if (conversation?.id) {
            loadMessages();
        }
    }, [conversation?.id]);

    useEffect(() => {
        if (!conversation?.id) return;

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

                    messageWithUser.users = !error && userData ? userData : {
                        id: payload.new.user_id,
                        email: 'unknown_user',
                        username: 'unknown_user',
                        avatar_url: 'avatar-01'
                    };
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

                if (payload.new.user_id !== user.id && checkForNewMentions) {
                    await checkForNewMentions(conversation.id, payload.new);
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [conversation?.id]);

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

                const fallbackProfile = {
                    id: user.id,
                    username: user.email?.split('@')[0] || 'Unknown',
                    email: user.email,
                    avatar_url: 'avatar-01'
                };

                if (error) {
                    setUserProfile(fallbackProfile);
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

    const handleSendMessage = async (messageContent, mentions = []) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    content: messageContent,
                    channel_id: conversation.id,
                    user_id: user.id,
                    mentions: mentions || []
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
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

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {pinnedMessages.length > 0 && (
                <PinnedMessagesBar
                    pinnedMessages={pinnedMessages}
                    user={user}
                    theme={theme}
                    currentTheme={currentTheme}
                    onMessageClick={() => { }}
                    onUnpinMessage={async (messageId) => {
                        try {
                            await unpinMessage(messageId);
                        } catch (error) {
                            // Error handled by usePinnedMessages hook
                        }
                    }}
                />
            )}
            <MessageArea
                messages={messages}
                user={user}
                theme={theme}
                currentTheme={currentTheme}
                currentChannel={conversation}
                canPin={canPin}
                onPinMessage={handlePinMessage}
                hidePinnedBar={true}
            />

            <MessageInput
                currentChannel={conversation}
                user={user}
                userProfile={userProfile}
                theme={theme}
                currentTheme={currentTheme}
                t={t}
                onError={onError}
                onSendMessage={handleSendMessage}
            />
        </div>
    );
}