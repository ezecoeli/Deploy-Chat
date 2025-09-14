import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { useTerminalTheme } from '../hooks/useTerminalTheme';
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
  
  const [messages, setMessages] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [unreadChannels, setUnreadChannels] = useState(new Set());
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  useEffect(() => {
    document.body.style.fontFamily = theme.font;
    return () => {
      document.body.style.fontFamily = '';
    };
  }, [theme.font]);

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

  const handleProfileUpdated = (updatedProfile) => {
    setUserProfile(updatedProfile);
    if (currentChannel?.id) {
      loadMessages(currentChannel.id);
    }
  };

  const loadMessages = useCallback(async (channelId) => {
    if (!channelId || messagesLoading) {
      return;
    }

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
      setError('Error cargando mensajes: ' + err.message);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [messagesLoading]);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    if (isInitializedRef.current) {
      return;
    }

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
        setError('Error inicializando canal general');
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
          setUnreadChannels(prev => new Set([...prev, payload.new.channel_id]));
        }
      })
      .subscribe();

    return () => {
      globalSubscription.unsubscribe();
    };
  }, [user, currentChannel?.id]);

  useEffect(() => {
    if (!currentChannel?.id || !user) {
      return;
    }
    
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
            if (messageExists) {
              return current;
            }
            return [...current, messageWithUser];
          });

          setUnreadChannels(prev => {
            const newSet = new Set(prev);
            newSet.delete(currentChannel.id);
            return newSet;
          });
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
  }, [currentChannel?.id, user?.id, userProfile]);

  const handleOpenProfile = () => {
    setShowProfileModal(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      setError(t('logoutError') || 'Error cerrando sesión');
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const [publicChannels, setPublicChannels] = useState([]);

  // check for unread messages in public channels
  useEffect(() => {
    if (user?.id && publicChannels.length > 0) {
      const checkUnread = async () => {
        const newUnread = new Set();

        // get last read times for all public channels
        const { data: reads } = await supabase
          .from('user_channel_reads')
          .select('channel_id, last_read_at')
          .eq('user_id', user.id);

        for (const channel of publicChannels) {
          const read = reads?.find(r => r.channel_id === channel.id);
          const { data: messages } = await supabase
            .from('messages')
            .select('id, created_at')
            .eq('channel_id', channel.id)
            .gt('created_at', read?.last_read_at || '1970-01-01');
          if (messages && messages.length > 0) {
            newUnread.add(channel.id);
          }
        }
        setUnreadChannels(newUnread);
      };
      checkUnread();
    }
  }, [user?.id, publicChannels]);

  // when a channel is selected, mark it as read
  const handleSelectConversation = useCallback(async (conversation) => {
    setMessages([]);
    setTypingUsers([]);
    setError('');
    setCurrentChannel(conversation);
    setSelectedConversation(conversation);

    // update date in supabase
    await supabase
      .from('user_channel_reads')
      .upsert({
        user_id: user.id,
        channel_id: conversation.id,
        last_read_at: new Date().toISOString()
      }, { onConflict: ['user_id', 'channel_id'] });

    setUnreadChannels(prev => {
      const newSet = new Set(prev);
      newSet.delete(conversation.id);
      return newSet;
    });

    const isPrivate = conversation.type === 'direct';
    setIsPrivateMode(isPrivate);

    if (!isPrivate) {
      await loadMessages(conversation.id);
    }
  }, [loadMessages, user?.id]);

  const getSidebarBorderColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return 'rgba(0, 255, 0, 0.3)';
      case 'coolRetro':
        return 'rgba(0, 255, 255, 0.3)';
      case 'windows95':
        return '#808080';
      case 'ubuntu':
        return 'rgba(255, 102, 0, 0.3)';
      case 'macOS':
        return '#d1d5db';
      default:
        return 'rgba(255, 255, 255, 0.2)';
    }
  };

  const getSidebarBackgroundColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return 'rgba(0, 0, 0, 0.95)';
      case 'coolRetro':
        return 'rgba(0, 0, 0, 0.95)';
      case 'windows95':
        return '#c0c0c0';
      case 'ubuntu':
        return 'rgba(45, 45, 45, 0.95)';
      case 'macOS':
        return 'rgba(248, 250, 252, 0.95)';
      default:
        return 'rgba(30, 30, 30, 0.95)';
    }
  };

  const getSidebarTextColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return '#00ff00';
      case 'coolRetro':
        return '#00ffff';
      case 'windows95':
        return '#000000';
      case 'ubuntu':
        return '#ff6600';
      case 'macOS':
        return '#374151';
      default:
        return '#ffffff';
    }
  };

  // load stored unread channels from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`unreadChannels_${user.id}`);
      if (stored) {
        setUnreadChannels(new Set(JSON.parse(stored)));
      }
    }
  }, [user?.id]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`unreadChannels_${user.id}`, JSON.stringify([...unreadChannels]));
    }
  }, [unreadChannels, user?.id]);

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
          fps={30} 
          density={0.8} 
          opacity={0.8} 
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
            onOpenProfile={handleOpenProfile}
            onLogout={handleLogout}
            isPrivateMode={isPrivateMode}
          />

          <ConnectionStatus
            user={user}
            theme={theme}
            t={t}
          />

          {messagesLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse text-center">
                <div className="text-lg opacity-70">Cargando mensajes...</div>
              </div>
            </div>
          )}

          {isPrivateMode && selectedConversation && !messagesLoading ? (
            <PrivateChat
              user={user}
              conversation={selectedConversation}
              theme={theme}
              currentTheme={currentTheme}
              onError={handleError}
            />
          ) : !messagesLoading ? (
            <>
              <MessageArea
                messages={messages}
                user={user}
                theme={theme}
                currentTheme={currentTheme}
                typingUsers={typingUsers}
                t={t}
              />

              <MessageInput
                currentChannel={currentChannel}
                user={user}
                userProfile={userProfile}
                theme={theme}
                currentTheme={currentTheme}
                t={t}
                onError={handleError}
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

      <div className="relative z-30">
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
          onProfileUpdated={handleProfileUpdated}
        />
      </div>
    </div>
  );
}