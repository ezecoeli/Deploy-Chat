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
  const [messagesLoading, setMessagesLoading] = useState(false);
  const isInitializedRef = useRef(false);
 
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

  // Load messages function - OPTIMIZED
  const loadMessages = useCallback(async (channelId) => {
    if (!channelId || messagesLoading) {
      return;
    }

    try {
      setMessagesLoading(true);
      console.log('Loading messages for channel:', channelId);
      
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

      console.log('Messages loaded:', data?.length || 0);
      setMessages(data || []);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Error cargando mensajes: ' + err.message);
      setMessages([]); // Clear messages on error
    } finally {
      setMessagesLoading(false);
    }
  }, [messagesLoading]);

  // Setup initial channel - FIXED
  useEffect(() => {
    if (loading || !user) {
      return;
    }

    // Only initialize once
    if (isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;

    const initializeDefaultChannel = async () => {
      try {
        // Get the actual general channel from database
        const { data: generalChannel, error } = await supabase
          .from('channels')
          .select('id, name, description, type')
          .eq('name', 'general')
          .eq('type', 'public')
          .eq('is_active', true)
          .eq('is_archived', false)
          .single();

        if (error) {
          console.error('Error loading general channel:', error);
          // Fallback to hardcoded if database query fails
          const fallbackChannel = {
            id: '95cd8c81-bd3f-4cf2-a9d1-ce8f0c53486c',
            name: 'general',
            type: 'public'
          };
          setCurrentChannel(fallbackChannel);
          await loadMessages(fallbackChannel.id);
          return;
        }

        console.log('Setting initial channel to general:', generalChannel);
        setCurrentChannel(generalChannel);
        await loadMessages(generalChannel.id);

      } catch (err) {
        console.error('Error initializing default channel:', err);
        setError('Error inicializando canal general');
      }
    };

    initializeDefaultChannel();
  }, [user, loading, loadMessages]);

  // Reset initialization when user changes
  useEffect(() => {
    if (user) {
      isInitializedRef.current = false;
    }
  }, [user?.id]);

  // Subscribe to new messages and typing events - OPTIMIZED
  useEffect(() => {
    if (!currentChannel?.id || !user) {
      return;
    }
    
    console.log('Setting up subscription for channel:', currentChannel.id);
    
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
          console.log('New message received:', payload.new);
          
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
          console.log('Subscription status:', status);
          // Retry on error
          if (status === 'CHANNEL_ERROR' && retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying subscription (${retryCount}/${maxRetries})`);
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
      console.log('Cleaning up subscription for channel:', currentChannel.id);
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

  // FIXED: handle select conversation for both public and private chats
  const handleSelectConversation = useCallback(async (conversation) => {
    console.log('Selecting conversation:', conversation);
    
    try {
      // Clear previous state
      setMessages([]);
      setTypingUsers([]);
      setError('');
      
      // Update current channel
      setCurrentChannel(conversation);
      setSelectedConversation(conversation);
      
      // Determine if it's private mode
      const isPrivate = conversation.type === 'direct';
      setIsPrivateMode(isPrivate);
      
      // Load messages for the selected channel
      if (!isPrivate) {
        // For public channels, load messages immediately
        await loadMessages(conversation.id);
      }
      // For private channels, PrivateChat component handles message loading
      
    } catch (error) {
      console.error('Error selecting conversation:', error);
      setError('Error al cambiar de canal');
    }
  }, [loadMessages]);

  // FIXED: handle back to public chat
  const handleBackToPublic = useCallback(async () => {
    try {
      setIsPrivateMode(false);
      setSelectedConversation(null);
      setMessages([]);
      setTypingUsers([]);
      setError('');
      
      // Get the actual general channel from database
      const { data: generalChannel, error } = await supabase
        .from('channels')
        .select('id, name, description, type')
        .eq('name', 'general')
        .eq('type', 'public')
        .eq('is_active', true)
        .eq('is_archived', false)
        .single();

      if (error) {
        console.error('Error loading general channel:', error);
        // Fallback to hardcoded
        const fallbackChannel = {
          id: '95cd8c81-bd3f-4cf2-a9d1-ce8f0c53486c',
          name: 'general',
          type: 'public'
        };
        setCurrentChannel(fallbackChannel);
        await loadMessages(fallbackChannel.id);
        return;
      }

      console.log('Returning to general channel:', generalChannel);
      setCurrentChannel(generalChannel);
      await loadMessages(generalChannel.id);
      
    } catch (error) {
      console.error('Error returning to public chat:', error);
      setError('Error al volver al chat general');
    }
  }, [loadMessages]);

  // Get sidebar styles based on current theme
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
        return '#c0c0c0';
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
        return '#000000';
      default:
        return '#ffffff';
    }
  };

  const getSidebarHeaderColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return '#00ff00';
      case 'coolRetro':
        return '#00ffff';
      case 'windows95':
        return '#000080';
      case 'ubuntu':
        return '#ff6600';
      case 'macOS':
        return '#000000';
      default:
        return '#ffffff';
    }
  };

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
        return '#000000';
      default:
        return 'rgba(255, 255, 255, 0.2)';
    }
  };

  const getButtonBackgroundColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return 'rgba(0, 255, 0, 0.1)';
      case 'coolRetro':
        return 'rgba(0, 255, 255, 0.1)';
      case 'windows95':
        return '#ffffff';
      case 'ubuntu':
        return 'rgba(255, 102, 0, 0.1)';
      case 'macOS':
        return '#ffffff';
      default:
        return 'rgba(255, 255, 255, 0.1)';
    }
  };

  const getButtonTextColor = () => {
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
        return '#000000';
      default:
        return '#ffffff';
    }
  };

  const getActiveChannelBackgroundColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return 'rgba(0, 255, 0, 0.2)';
      case 'coolRetro':
        return 'rgba(0, 255, 255, 0.2)';
      case 'windows95':
        return '#c0c0c0';
      case 'ubuntu':
        return 'rgba(255, 102, 0, 0.2)';
      case 'macOS':
        return '#000000';
      default:
        return 'rgba(255, 255, 255, 0.2)';
    }
  };

  const getActiveChannelTextColor = () => {
    switch (currentTheme) {
      case 'matrix':
        return '#00ff00';
      case 'coolRetro':
        return '#00ffff';
      case 'windows95':
        return '#ffffff';
      case 'ubuntu':
        return '#ff6600';
      case 'macOS':
        return '#ffffff';
      default:
        return '#ffffff';
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
        
        {/* Sidebar */}
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

          {/* Sidebar Component */}
          <Sidebar
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

          {/* Show loading state */}
          {messagesLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-pulse text-center">
                <div className="text-lg opacity-70">Cargando mensajes...</div>
              </div>
            </div>
          )}

          {/* Optional: Private Chat */}
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
                onTypingChange={handleTypingChange}
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