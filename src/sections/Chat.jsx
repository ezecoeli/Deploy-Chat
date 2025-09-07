import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { useTerminalTheme } from '../hooks/useTerminalTheme';
import { getAvatarById } from '../config/avatars';
import ThemeSelector from '../components/ThemeSelector';
import UserProfileModal from '../components/UserProfileModal';
import { FiUser, FiLogOut, FiChevronDown, FiUsers } from 'react-icons/fi';

export default function Chat() {
  const { user, logout, loading } = useAuth();
  const { t } = useTranslation();
  const { theme, currentTheme } = useTerminalTheme();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentChannel, setCurrentChannel] = useState(null);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('online');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [memberCount, setMemberCount] = useState(0); 
  const messagesEndRef = useRef(null);
  const userMenuRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showUserMenu]);

  // Close dropdowns with the Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showUserMenu]);

  // load user profile and member count on user change
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadMemberCount(); 
    }
  }, [user]);

  // Apply theme font to body
  useEffect(() => {
    document.body.style.fontFamily = theme.font;
    return () => {
      document.body.style.fontFamily = '';
    };
  }, [theme.font]);

  // load member function to get total users count
  const loadMemberCount = async () => {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      
      setMemberCount(count || 0);
    } catch (error) {
      setMemberCount(0);
    }
  };

  // Subscribe to changes in the users table to update count in real-time
  useEffect(() => {
    if (!user) return;
    
    const userSubscription = supabase
      .channel('users_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, (payload) => {
        // Reload member count on any change
        loadMemberCount();
      })
      .subscribe();

    return () => {
      userSubscription.unsubscribe();
    };
  }, [user]);

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
      // Fallback to auth data
      setUserProfile({
        username: user.email.split('@')[0],
        avatar_url: 'avatar-01' // Default avatar
      });
    }
  };

  const handleProfileUpdated = (updatedProfile) => {
    setUserProfile(updatedProfile);
    // Reload messages to update avatars in chat
    if (currentChannel?.id) {
      loadMessages(currentChannel.id);
    }
  };

  const renderAvatar = (avatarUrl, username, size = 'w-8 h-8') => {
    // if is a preloaded avatar
    const preloadedAvatar = getAvatarById(avatarUrl);
    if (preloadedAvatar) {
      return (
        <img 
          src={preloadedAvatar.src} 
          alt={preloadedAvatar.name}
          className={`${size} rounded-full object-cover`}
        />
      );
    }

    // If it's a custom URL
    if (avatarUrl && !avatarUrl.startsWith('avatar-')) {
      return (
        <img 
          src={avatarUrl} 
          alt={`Avatar de ${username}`}
          className={`${size} rounded-full object-cover`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    // Fallback
    return <FiUser className={`${size.replace('w-', '').replace('h-', '')} text-gray-400`} />;
  };

  // Detect change in connection status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online');
    };
    
    const handleOffline = () => {
      setConnectionStatus('offline');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setConnectionStatus('away');
      } else if (navigator.onLine) {
        setConnectionStatus('online');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // load messages function
  const loadMessages = useCallback(async (channelId) => {
    if (!channelId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, users:user_id (*)`)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      setMessages(data || []);
    } catch (err) {
      setError('Error cargando mensajes: ' + err.message);
    }
  }, []);

  // setup initial channel and load messages
  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setCurrentChannel(null);
      setMessages([]);
      return;
    }

    // Prevent multiple initializations
    if (currentChannel) {
      return;
    }

    // Only set channel once on initialization
    const hardcodedChannel = {
      id: '95cd8c81-bd3f-4cf2-a9d1-ce8f0c53486c',
      name: 'general',
    };

    setCurrentChannel(hardcodedChannel);

    // Load messages only once
    const loadInitialMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`*, users:user_id (*)`)
          .eq('channel_id', hardcodedChannel.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) throw error;

        setMessages(data || []);
      } catch (err) {
        setError('Error cargando mensajes: ' + err.message);
      }
    };

    loadInitialMessages();
  }, [user, loading, currentChannel]);

  // Auto-scroll to new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to new messages and typing events
  useEffect(() => {
    if (!currentChannel?.id || !user) {
      return;
    }
    
    let retryCount = 0;
    const maxRetries = 3;

    const createSubscription = () => {
      const subscription = supabase
        .channel(`messages:${currentChannel.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${currentChannel.id}`
        }, (payload) => {
          setMessages(current => {
            const messageExists = current.some(msg => msg.id === payload.new.id);
            if (messageExists) {
              return current;
            }
            
            return [...current, {
              ...payload.new,
              users: payload.new.user_id === user.id ? user : null
            }];
          });
        })
        // Subscribe to typing events
        .on('broadcast', { event: 'typing' }, (payload) => {
          const { user_id, username, is_typing } = payload.payload;

          // Don't show our own typing indicator
          if (user_id === user.id) return;
          
          setTypingUsers(current => {
            if (is_typing) {
              // Add user if not already present
              if (!current.find(u => u.user_id === user_id)) {
                return [...current, { user_id, username }];
              }
              return current;
            } else {
              // Remove user
              return current.filter(u => u.user_id !== user_id);
            }
          });

          // Auto-remove after 3 seconds if no more events
          if (is_typing) {
            setTimeout(() => {
              setTypingUsers(current => 
                current.filter(u => u.user_id !== user_id)
              );
            }, 3000);
          }
        })
        .subscribe((status) => {
          // Retry on error
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
  }, [currentChannel?.id, user?.id]);

  // Function to get the visual connection status
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'online':
        return {
          color: 'bg-green-500',
          text: t('online') || 'En línea',
          textColor: 'text-green-400'
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          text: t('offline') || 'Desconectado',
          textColor: 'text-red-400'
        };
      case 'away':
        return {
          color: 'bg-yellow-500',
          text: 'Ausente',
          textColor: 'text-yellow-400'
        };
      default:
        return {
          color: 'bg-gray-500',
          text: 'Desconocido',
          textColor: 'text-gray-400'
        };
    }
  };

  // Function to handle typing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Detect if user is typing
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      
      // Broadcast typing event
      if (currentChannel?.id) {
        supabase.channel(`messages:${currentChannel.id}`)
          .send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              user_id: user.id,
              username: userProfile?.username || user?.email?.split('@')[0],
              is_typing: true
            }
          });
      }
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      
      // Broadcast stop typing event
      if (currentChannel?.id) {
        supabase.channel(`messages:${currentChannel.id}`)
          .send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              user_id: user.id,
              username: userProfile?.username || user?.email?.split('@')[0],
              is_typing: false
            }
          });
      }
    }, 1000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChannel || !user) return;

    // Stop typing indicator when sending message
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            content: newMessage.trim(),
            user_id: user.id,
            channel_id: currentChannel.id,
          },
        ]);

      if (error) throw error;

      setNewMessage('');
      setError('');
    } catch (err) {
      setError('Error enviando mensaje: ' + err.message);
    }
  };

  // logout 
  const handleLogout = async () => {
    try {
      // clean up typing status before logout
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      await logout();
    } catch (err) {
      setError(t('logoutError') || 'Error cerrando sesión');
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div 
      className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-br ${theme.colors.bg}`}
      style={{
        background: currentTheme === 'coolRetro' ? '#000000' : undefined
      }}
    >
      <div className="w-full max-w-4xl h-screen p-4 flex flex-col relative mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-4">
          <div>
            <h1 
              className="text-2xl font-bold font-mono"
              style={{ 
                color: theme.colors.primary,
                textShadow: theme.effects.textShadow 
              }}
            >
              Deploy Chat
            </h1>
            <p 
              className="text-sm font-mono"
              style={{ color: theme.colors.textSecondary }}
            >
              {currentChannel ? `${theme.prompt} cd #${currentChannel.name}` : 'Connecting...'}
            </p>
          </div>
          
          {/* User Profile Section */}
          <div className="flex items-center gap-4">
           
            <ThemeSelector />
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${theme.colors.input} hover:opacity-80`}
                style={{ 
                  color: theme.colors.text,
                  fontFamily: theme.font 
                }}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center flex-shrink-0">
                  {renderAvatar(userProfile?.avatar_url || 'avatar-01', userProfile?.username || user?.email)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">
                    {userProfile?.username || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs opacity-70">
                    {statusInfo.text}
                  </p>
                </div>
                <FiChevronDown className={`w-3 h-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
                  style={{ 
                    zIndex: currentTheme === 'coolRetro' ? 51000 : 50,
                    backgroundColor: currentTheme === 'coolRetro' ? 'rgba(0, 0, 0, 0.95)' : undefined,
                    border: currentTheme === 'coolRetro' ? '1px solid #ffb000' : undefined
                  }}
                >
                  <div className="p-3">
                    {/* Header */}
                    <div className="mb-3 pb-2 border-b border-gray-600">
                      <p 
                        className="text-xs font-mono text-center"
                        style={{ 
                          color: currentTheme === 'coolRetro' ? '#cc8800' : '#9ca3af',
                          textShadow: currentTheme === 'coolRetro' ? '0 0 2px #ffb000' : 'none'
                        }}
                      >
                        // user_menu
                      </p>
                    </div>

                    {/* menu options */}
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setShowProfileModal(true);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors hover:bg-gray-700 flex items-center gap-2 ${
                          currentTheme === 'coolRetro' ? 'crt-menu-item' : ''
                        }`}
                        style={{ 
                          color: currentTheme === 'coolRetro' ? '#ffcc00' : '#d1d5db',
                          textShadow: currentTheme === 'coolRetro' ? '0 0 3px #ffb000' : 'none',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <FiUser className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{t('editProfile') || 'Editar perfil'}</span>
                      </button>
                      
                      <hr 
                        className="my-2"
                        style={{ 
                          borderColor: currentTheme === 'coolRetro' ? '#664400' : '#4b5563'
                        }}
                      />
                      
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors hover:bg-red-900/20 flex items-center gap-2 ${
                          currentTheme === 'coolRetro' ? 'crt-menu-item-danger' : ''
                        }`}
                        style={{ 
                          color: currentTheme === 'coolRetro' ? '#ff9999' : '#ef4444',
                          textShadow: currentTheme === 'coolRetro' ? '0 0 3px #ff6666' : 'none',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <FiLogOut className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{t('logout') || 'Cerrar sesión'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* member count */}
        <div className="mb-2 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <FiUsers className="w-4 h-4" style={{ color: theme.colors.accent }} />
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {memberCount === 1 
                ? (t('oneMember') || '1 user online')
                : (t('membersCount')?.replace('{count}', memberCount) || `${memberCount} users online`)
              }
            </p>
          </div>
          {/* statusInfo */}
          <div className="flex items-center gap-2">
            <div 
              className={`w-2 h-2 rounded-full ${statusInfo.color} ${
                connectionStatus === 'online' ? 'animate-pulse' : ''
              }`}
            />
            <span className={`text-sm ${statusInfo.textColor}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>

        {/* message area */}
        <div 
          className={`flex-1 rounded-lg p-4 mb-4 overflow-y-auto ${theme.colors.message}`}
          style={{
            background: currentTheme === 'coolRetro' ? '#000000' : undefined,
            border: currentTheme === 'coolRetro' ? '1px solid #ffb000' : undefined
          }}
        >
          {messages.length === 0 ? (
            <div className="text-center mt-8">
              <p 
                className={currentTheme === 'default' ? 'text-gray-500' : 'font-mono'}
                style={{ color: theme.colors.textSecondary }}
              >
                {currentTheme === 'default' 
                  ? "No hay mensajes aún. ¡Sé el primero en escribir!"
                  : `${theme.prompt} echo "No messages yet. Start the conversation!"`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwnMessage = message.user_id === user?.id;
                const messageUser = message.users || { 
                  email: 'unknown_user',
                  username: 'unknown_user',
                  avatar_url: 'avatar-01'
                };
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-xs lg:max-w-md ${
                      isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      {!isOwnMessage && (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center flex-shrink-0">
                          {renderAvatar(messageUser.avatar_url, messageUser.username)}
                        </div>
                      )}
                      
                      <div className="font-mono">
                        {!isOwnMessage && (
                          <div className="flex items-center gap-1 mb-1">
                            <span style={{ color: theme.colors.accent }}>
                              {messageUser.username || messageUser.email}@deploy-chat
                            </span>
                            <span style={{ color: theme.colors.textSecondary }}>
                              :{theme.prompt}
                            </span>
                          </div>
                        )}
                        <div 
                          className="px-3 py-2 rounded"
                          style={{ 
                            backgroundColor: isOwnMessage 
                              ? 'rgba(230, 160, 0, 0.1)' 
                              : 'rgba(0,0,0,0.4)', 
                            border: `1px solid ${currentTheme === 'coolRetro' ? '#664400' : theme.colors.border}`,
                            color: theme.colors.text,
                            textShadow: currentTheme === 'coolRetro' 
                              ? '0 0 3px #e6a000'
                              : 'none'
                          }}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            // {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* users typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 opacity-70">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span 
                    className="text-xs font-mono"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {typingUsers.length === 1 
                      ? `${typingUsers[0].username} está escribiendo...`
                      : `${typingUsers.length} usuarios están escribiendo...`
                    }
                  </span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* send message form */}
        <form onSubmit={sendMessage} className="flex gap-2 font-mono">
          <div 
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg" 
            style={{ 
              backgroundColor: currentTheme === 'coolRetro' ? '#000000' : 'rgba(0,0,0,0.5)', 
              border: `1px solid ${theme.colors.border}` 
            }}
          >
            <span 
              className="px-2 py-1 rounded-md font-medium"
              style={{ 
                color: theme.colors.accent,
                backgroundColor: `${theme.colors.accent}15`,
                border: `1px solid ${theme.colors.accent}30`
              }}
            >
              {userProfile?.username || user?.email?.split('@')[0]}@deploy-chat:{theme.prompt}
            </span>
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder={currentTheme === 'default' ? t('typeMessage') || "Escribe un mensaje..." : "echo 'Hello World!'"}
              className="flex-1 rounded-md p-1 outline-none"
              style={{ 
                color: theme.colors.text,
                background: currentTheme === 'coolRetro' ? '#000000' : '#374151',
                border: currentTheme === 'coolRetro' ? '1px solid #664400' : 'none',
                textShadow: currentTheme === 'coolRetro' ? '0 0 2px #e6a000' : 'none',
                fontFamily: currentTheme === 'coolRetro' ? '"Courier New", monospace' : 'inherit'
              }}
              disabled={!currentChannel}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || !currentChannel}
            className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
              currentTheme === 'default' ? 'font-medium' : 'font-mono'
            } ${theme.colors.button}`}
          >
            {currentTheme === 'default' ? t('send') : t('execute')}
          </button>
        </form>

        {error && (
          <div className="mt-2 p-3 bg-red-900 border border-red-600 text-red-100 rounded-lg text-sm font-mono">
            Error: {error}
          </div>
        )}
      </div>

      {/* user profile modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
}