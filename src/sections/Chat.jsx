import React, { useState, useEffect, useCallback } from 'react';
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
import DirectMessagesList from '../components/chat/DirectMessagesList';
import { useEncryption } from '../hooks/useEncryption';
import { ImEarth } from "react-icons/im";
import { BsArrowLeft } from "react-icons/bs";

export default function Chat() {
  const { user, logout, loading } = useAuth();
  const { t } = useTranslation();
  const { theme, currentTheme } = useTerminalTheme();
  
  const [messages, setMessages] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const { userKeyPair, isKeysReady } = useEncryption(user);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
 
  // Load user profile on user change
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // Apply theme font to body
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

  // Load messages function
  const loadMessages = useCallback(async (channelId) => {
    if (!channelId) {
      return;
    }

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
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      setMessages(data || []);
    } catch (err) {
      setError('Error cargando mensajes: ' + err.message);
    }
  }, []);

  // Setup initial channel and load messages
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
          .select(`
            *,
            users:user_id (
              id,
              email,
              username,
              avatar_url
            )
          `)
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
        }, async (payload) => { // async function to fetch user data
          // Get complete user information who sent the message
          let messageWithUser = { ...payload.new };
          
          if (payload.new.user_id === user.id) {
            // If it's our message, use our updated information
            messageWithUser.users = {
              id: user.id,
              email: user.email,
              username: userProfile?.username || user.email.split('@')[0],
              avatar_url: userProfile?.avatar_url || 'avatar-01'
            };
          } else {
            // If it's from another user, fetch their information from the database
            try {
              const { data: userData, error } = await supabase
                .from('users')
                .select('id, email, username, avatar_url')
                .eq('id', payload.new.user_id)
                .single();
              
              if (!error && userData) {
                messageWithUser.users = userData;
              } else {
                // Fallback if user is not found
                messageWithUser.users = {
                  id: payload.new.user_id,
                  email: 'unknown_user',
                  username: 'unknown_user',
                  avatar_url: 'avatar-01'
                };
              }
            } catch (err) {
              // Fallback in case of network or query error
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
  }, [currentChannel?.id, user?.id, userProfile]); 

  // Callback handlers for components
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

  const handleTypingChange = (isTyping) => {
    // Handle typing status changes if needed
  };

  // handle select conversation for private chat
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setCurrentChannel(conversation);
    setIsPrivateMode(conversation.type === 'direct');
    setMessages([]); // clear public chat messages
  };

  // handle back to public chat
  const handleBackToPublic = () => {
    setIsPrivateMode(false);
    setSelectedConversation(null);
    
    // back to hardcoded public channel
    const hardcodedChannel = {
      id: '95cd8c81-bd3f-4cf2-a9d1-ce8f0c53486c',
      name: 'general',
    };
    
    setCurrentChannel(hardcodedChannel);
    loadMessages(hardcodedChannel.id);
  };

  // Get sidebar styles based on current theme
  const getSidebarBackgroundColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return 'rgba(0, 0, 0, 0.95)'; // Almost solid black
      case 'coolRetro':
        return 'rgba(0, 0, 0, 0.95)'; // Almost solid black
      case 'windows95':
        return '#c0c0c0'; // Classic Windows 95 gray
      case 'ubuntu':
        return 'rgba(45, 45, 45, 0.95)'; // Dark gray
      case 'macOS':
        return '#c0c0c0'; // Gray
      default:
        return 'rgba(30, 30, 30, 0.95)'; // Dark gray
    }
  };

  const getSidebarTextColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return '#00ff00'; // Bright green
      case 'coolRetro':
        return '#00ffff'; // Cyan
      case 'windows95':
        return '#000000'; // Black text
      case 'ubuntu':
        return '#ff6600'; // Orange
      case 'macOS':
        return '#000000'; // Black
      default:
        return '#ffffff'; // White
    }
  };

  const getSidebarHeaderColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return '#00ff00'; // Bright green
      case 'coolRetro':
        return '#00ffff'; // Cyan  
      case 'windows95':
        return '#000080'; // Navy blue
      case 'ubuntu':
        return '#ff6600'; // Orange
      case 'macOS':
        return '#000000'; // Black
      default:
        return '#ffffff'; // White
    }
  };

  const getSidebarBorderColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return 'rgba(0, 255, 0, 0.3)'; // Green border
      case 'coolRetro':
        return 'rgba(0, 255, 255, 0.3)'; // Cyan border
      case 'windows95':
        return '#808080'; // Gray border
      case 'ubuntu':
        return 'rgba(255, 102, 0, 0.3)'; // Orange border
      case 'macOS':
        return '#000000'; // Black border
      default:
        return 'rgba(255, 255, 255, 0.2)'; // Light border
    }
  };

  const getButtonBackgroundColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return 'rgba(0, 255, 0, 0.1)'; // Green background
      case 'coolRetro':
        return 'rgba(0, 255, 255, 0.1)'; // Cyan background
      case 'windows95':
        return '#ffffff'; // White background
      case 'ubuntu':
        return 'rgba(255, 102, 0, 0.1)'; // Orange background
      case 'macOS':
        return '#ffffff'; // White background
      default:
        return 'rgba(255, 255, 255, 0.1)'; // Light background
    }
  };

  const getButtonTextColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return '#00ff00'; // Green text
      case 'coolRetro':
        return '#00ffff'; // Cyan text
      case 'windows95':
        return '#000000'; // Black text
      case 'ubuntu':
        return '#ff6600'; // Orange text
      case 'macOS':
        return '#000000'; // Black text
      default:
        return '#ffffff'; // White text
    }
  };

  const getActiveChannelBackgroundColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return 'rgba(0, 255, 0, 0.2)'; // Green highlight
      case 'coolRetro':
        return 'rgba(0, 255, 255, 0.2)'; // Cyan highlight
      case 'windows95':
        return '#c0c0c0'; // Gray highlight
      case 'ubuntu':
        return 'rgba(255, 102, 0, 0.2)'; // Orange highlight
      case 'macOS':
        return '#000000'; // Black highlight
      default:
        return 'rgba(255, 255, 255, 0.2)'; // Light highlight
    }
  };

  const getActiveChannelTextColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return '#00ff00'; // Green text
      case 'coolRetro':
        return '#00ffff'; // Cyan text
      case 'windows95':
        return '#ffffff'; // White text on blue
      case 'ubuntu':
        return '#ff6600'; // Orange text
      case 'macOS':
        return '#ffffff'; // White text
      default:
        return '#ffffff'; // White text
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
      {/* Matrix Rain Effect */}
      {currentTheme === 'matrix' && (
        <MatrixRain 
          fps={30} 
          density={0.8} 
          opacity={0.8} 
        />
      )}
      
      <div className="w-full max-w-6xl h-screen p-4 flex relative mx-auto z-20">
        
        {/* Sidebar  */}
        <div 
          className="w-64 flex-shrink-0 border-r overflow-y-auto border"
          style={{ 
            borderColor: getSidebarBorderColor(),
            backgroundColor: getSidebarBackgroundColor(),
            color: getSidebarTextColor()
          }}
        >
          {/* Button to go back to public chat */}
          {isPrivateMode && (
            <div className="p-4 border-b" style={{ borderColor: getSidebarBorderColor() }}>
              <button
                onClick={handleBackToPublic}
                className="w-full text-left px-3 py-2 rounded hover:opacity-80 transition-opacity font-medium"
                style={{ 
                  backgroundColor: getButtonBackgroundColor(),
                  color: getButtonTextColor(),
                  border: `1px solid ${getSidebarBorderColor()}`
                }}
              >
                <BsArrowLeft className='inline-block mr-1' />{t('backGeneralChat')}
              </button>
            </div>
          )}

          {/* Public Channel Section */}
          {!isPrivateMode && (
            <div className="p-4 border-b" style={{ borderColor: getSidebarBorderColor() }}>
              <h3 
                className="text-sm font-bold uppercase tracking-wide mb-2"
                style={{ color: getSidebarHeaderColor() }}
              >
                {t('publicChannel')}<ImEarth className='w-4 h-4 inline-block ml-2' />
              </h3>
              <div 
                className="flex items-center gap-2 px-2 py-2 rounded"
                style={{ 
                  backgroundColor: getActiveChannelBackgroundColor(),
                  color: getActiveChannelTextColor()
                }}
              >
                <span className="text-xs opacity-70">#</span>
                <span>general</span>
              </div>
            </div>
          )}

          {/* Direct Messages List */}
          <DirectMessagesList 
            user={user}
            onSelectConversation={handleSelectConversation}
            currentChannel={currentChannel}
            theme={theme}
            currentTheme={currentTheme}
          />
        </div>

        {/* main area */}
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

          {/* Optional: Private Chat */}
          {isPrivateMode && selectedConversation ? (
            <PrivateChat
              user={user}
              conversation={selectedConversation}
              theme={theme}
              currentTheme={currentTheme}
              onError={handleError}
            />
          ) : (
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
                onTypingChange={handleTypingChange}
              />
            </>
          )}

          {error && (
            <div className="mt-2 p-3 bg-red-900 border border-red-600 text-red-100 rounded-lg text-sm font-mono">
              Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
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