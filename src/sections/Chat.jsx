import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { useTerminalTheme } from '../hooks/useTerminalTheme';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import UserProfileModal from '../components/UserProfileModal';
import ChatHeader from '../components/chat/ChatHeader';
import ConnectionStatus from '../components/chat/ConnectionStatus';
import MessageArea from '../components/chat/MessageArea';
import MessageInput from '../components/chat/MessageInput';
import MatrixRain from '../components/MatrixRain';
import PrivateChat from '../components/chat/PrivateChat';
import Sidebar from '../components/chat/Sidebar';

export default function Chat() {
  const { user, logout, loading } = useAuth();
  const { t } = useTranslation();
  const { theme, currentTheme } = useTerminalTheme();
  
  const {
    unreadChannels,
    markChannelAsRead,
    addUnreadChannel,
    removeUnreadChannel
  } = useUnreadMessages(user);
  
  const [messages, setMessages] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [channels, setChannels] = useState([]);
  const isInitializedRef = useRef(false);

  const loadChannels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('id, name, type, description')
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('name');
    
      if (!error) {
        setChannels(data || []);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      setUserProfile({
        username: user.email.split('@')[0],
        avatar_url: 'avatar-01'
      });
    }
  };

  const loadMessages = useCallback(async (channelId) => {
    if (!channelId || messagesLoading) return;

    try {
      setMessagesLoading(true);
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
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
      setError('');
    } catch (err) {
      setError('Error loading messages: ' + err.message);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [messagesLoading]);

  const loadOlderMessages = async (targetDate, targetMessageId = null) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          channel_id,
          is_encrypted,
          encrypted_content,
          encryption_iv,
          users:user_id (
            id,
            email,
            username,
            avatar_url
          )
        `)
        .eq('channel_id', currentChannel?.id)
        .lte('created_at', targetDate)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setMessages(prev => {
          const reversedData = data.reverse();
          const existingIds = new Set(prev.map(msg => msg.id));
          const newMessages = reversedData.filter(msg => !existingIds.has(msg.id));
          return [...newMessages, ...prev];
        });

        if (targetMessageId) {
          setTimeout(() => {
            const messageElement = document.querySelector(`[data-message-id="${targetMessageId}"]`);
            if (messageElement) {
              messageElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              messageElement.classList.add('highlight-message');
              setTimeout(() => {
                messageElement.classList.remove('highlight-message');
              }, 3000);
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
    }
  };

  const handleNavigateToMessage = useCallback(async (message) => {
    try {
      if (message.channel_id !== currentChannel?.id) {
        const targetChannel = channels.find(ch => ch.id === message.channel_id);
        if (targetChannel) {
          setCurrentChannel(targetChannel);
          setIsPrivateMode(targetChannel.type === 'direct');
          await loadMessages(targetChannel.id);
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          return;
        }
      }

      setTimeout(() => {
        const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
        
        if (messageElement) {
          messageElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          messageElement.classList.add('highlight-message');
          setTimeout(() => {
            messageElement.classList.remove('highlight-message');
          }, 3000);
        } else {
          loadOlderMessages(message.created_at, message.id);
        }
      }, 300);

    } catch (error) {
      console.error('Error navigating to message:', error);
    }
  }, [currentChannel, channels, loadMessages]);

  useEffect(() => {
    if (user) {
      loadChannels();
      loadUserProfile();
    }
  }, [user, loadChannels]);

  useEffect(() => {
    document.body.style.fontFamily = theme.font;
    return () => {
      document.body.style.fontFamily = '';
    };
  }, [theme.font]);

  const handleProfileUpdated = (updatedProfile) => {
    setUserProfile(updatedProfile);
    if (currentChannel?.id) {
      loadMessages(currentChannel.id);
    }
  };

  useEffect(() => {
    if (loading || !user || isInitializedRef.current) return;

    isInitializedRef.current = true;

    const initializeDefaultChannel = async () => {
      try {
        const { data: generalChannel, error } = await supabase
          .from('channels')
          .select('id, name, description, type')
          .eq('name', 'general')
          .eq('type', 'public')
          .eq('is_active', true)
          .eq('is_archived', false)
          .single();

        if (error) {
          const fallbackChannel = {
            id: '06cbcdea-0dff-438d-aad9-f94a097298d3',
            name: 'general',
            type: 'public'
          };
          setCurrentChannel(fallbackChannel);
          await loadMessages(fallbackChannel.id);
          return;
        }

        setCurrentChannel(generalChannel);
        await loadMessages(generalChannel.id);
      } catch (err) {
        setError('Error initializing general channel');
      }
    };

    initializeDefaultChannel();
  }, [user, loading, loadMessages]);

  useEffect(() => {
    if (user) {
      isInitializedRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const globalSubscription = supabase
      .channel(`messages_global_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        if (
          payload.new.user_id !== user.id &&
          payload.new.channel_id !== currentChannel?.id
        ) {
          addUnreadChannel(payload.new.channel_id, payload.new.user_id);
        }
      })
      .subscribe();

    return () => {
      globalSubscription.unsubscribe();
    };
  }, [user, currentChannel?.id, addUnreadChannel]);

  useEffect(() => {
    if (!currentChannel?.id || !user) return;
    
    let retryCount = 0;
    const maxRetries = 3;

    const createSubscription = () => {
      const subscription = supabase
        .channel(`messages_${currentChannel.id}_${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${currentChannel.id}`
        }, async (payload) => {
          let messageWithUser = { ...payload.new };
          
          if (payload.new.user_id === user.id) {
            messageWithUser.users = {
              id: user.id,
              email: user.email,
              username: userProfile?.username || user.email.split('@')[0],
              avatar_url: userProfile?.avatar_url || 'avatar-01'
            };
          } else {
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
          }

          setMessages(current => {
            const messageExists = current.some(msg => msg.id === payload.new.id);
            if (messageExists) return current;
            return [...current, messageWithUser];
          });

          removeUnreadChannel(currentChannel.id);
        })
        .on('broadcast', { event: 'typing' }, (payload) => {
          const { user_id, username, is_typing } = payload.payload;

          if (user_id === user.id) return;
          
          setTypingUsers(current => {
            if (is_typing) {
              if (!current.find(u => u.user_id === user_id)) {
                return [...current, { user_id, username }];
              }
              return current;
            } else {
              return current.filter(u => u.user_id !== user_id);
            }
          });

          if (is_typing) {
            setTimeout(() => {
              setTypingUsers(current => 
                current.filter(u => u.user_id !== user_id)
              );
            }, 3000);
          }
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' && retryCount < maxRetries) {
            retryCount++;
            setTimeout(() => {
              subscription.unsubscribe();
              createSubscription();
            }, 2000 * retryCount); 
          }
        });
        
      return subscription;
    };

    const subscription = createSubscription();
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [currentChannel?.id, user?.id, userProfile, removeUnreadChannel]);

  const handleSelectConversation = useCallback(async (conversation) => {
    setMessages([]);
    setTypingUsers([]);
    setError('');
    setCurrentChannel(conversation);
    setSelectedConversation(conversation);

    await markChannelAsRead(conversation.id);

    const isPrivate = conversation.type === 'direct';
    setIsPrivateMode(isPrivate);

    if (!isPrivate) {
      await loadMessages(conversation.id);
    }
  }, [loadMessages, markChannelAsRead]);

  const getSidebarBorderColor = () => {
    switch (currentTheme) {
      case 'matrix': return 'rgba(0, 255, 0, 0.3)';
      case 'coolRetro': return 'rgba(0, 255, 255, 0.3)';
      case 'windows95': return '#808080';
      case 'ubuntu': return 'rgba(255, 102, 0, 0.3)';
      case 'macOS': return '#d1d5db';
      default: return 'rgba(255, 255, 255, 0.2)';
    }
  };

  const getSidebarBackgroundColor = () => {
    switch (currentTheme) {
      case 'matrix': return 'rgba(0, 0, 0, 0.95)';
      case 'coolRetro': return 'rgba(0, 0, 0, 0.95)';
      case 'windows95': return '#c0c0c0';
      case 'ubuntu': return 'rgba(45, 45, 45, 0.95)';
      case 'macOS': return 'rgba(248, 250, 252, 0.95)';
      default: return 'rgba(30, 30, 30, 0.95)';
    }
  };

  const getSidebarTextColor = () => {
    switch (currentTheme) {
      case 'matrix': return '#00ff00';
      case 'coolRetro': return '#00ffff';
      case 'windows95': return '#000000';
      case 'ubuntu': return '#ff6600';
      case 'macOS': return '#374151';
      default: return '#ffffff';
    }
  };

  return (
    <div 
      className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-br ${theme.colors.bg}`}
      style={{
        background: currentTheme === 'coolRetro' ? '#000000' : 
                   currentTheme === 'matrix' ? '#000000' : undefined
      }}
    >
      {currentTheme === 'matrix' && (
        <MatrixRain 
          fps={15} 
          density={0.8} 
          opacity={0.15} 
        />
      )}
      
      <div className="w-full max-w-6xl h-screen p-4 flex relative mx-auto z-20">
        <div 
          className="w-64 flex-shrink-0 border-r overflow-y-auto border"
          style={{ 
            borderColor: getSidebarBorderColor(),
            backgroundColor: getSidebarBackgroundColor(),
            color: getSidebarTextColor()
          }}
        >
          <Sidebar
            user={user}
            onSelectConversation={handleSelectConversation}
            currentChannel={currentChannel}
            theme={theme}
            currentTheme={currentTheme}
            unreadChannels={unreadChannels}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
            currentChannel={currentChannel}
            theme={theme}
            currentTheme={currentTheme}
            user={user}
            userProfile={userProfile}
            t={t}
            onOpenProfile={() => setShowProfileModal(true)}
            onLogout={async () => {
              try {
                await logout();
              } catch (err) {
                setError(t('logoutError') || 'Error logging out');
              }
            }}
            isPrivateMode={isPrivateMode}
            onNavigateToMessage={handleNavigateToMessage} 
          />

          <ConnectionStatus
            user={user}
            theme={theme}
            t={t}
          />

          {messagesLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse text-center">
                <div className="text-lg opacity-70">Loading messages...</div>
              </div>
            </div>
          )}

          {isPrivateMode && selectedConversation && !messagesLoading ? (
            <PrivateChat
              user={user}
              conversation={selectedConversation}
              theme={theme}
              currentTheme={currentTheme}
              onError={setError}
            />
          ) : !messagesLoading ? (
            <>
              <MessageArea
                messages={messages}
                user={user}
                theme={theme}
                currentTheme={currentTheme}
                typingUsers={typingUsers}
                currentChannel={currentChannel}
              />

              <MessageInput
                currentChannel={currentChannel}
                user={user}
                userProfile={userProfile}
                theme={theme}
                currentTheme={currentTheme}
                t={t}
                onError={setError}
                onMessageSent={() => markChannelAsRead(currentChannel?.id)}
              />
            </>
          ) : null}

          {error && (
            <div className="mt-2 p-3 bg-red-900 border border-red-600 text-red-100 rounded-lg text-sm font-mono">
              Error: {error}
            </div>
          )}
        </div>
      </div>

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
}