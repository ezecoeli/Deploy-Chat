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

export default function Chat() {
  const { user, logout, loading } = useAuth();
  const { t } = useTranslation();
  const { theme, currentTheme } = useTerminalTheme();
  
  const [messages, setMessages] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
 
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
      // MEJORADO: Consulta más específica con campos explícitos del usuario
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
        // MEJORADO: Misma consulta específica que en loadMessages
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
        }, async (payload) => { // CAMBIADO: Función ahora es async para consultar usuario
          // SOLUCIONADO: Obtener información completa del usuario que envió el mensaje
          let messageWithUser = { ...payload.new };
          
          if (payload.new.user_id === user.id) {
            // Si es nuestro mensaje, usar nuestra información actualizada
            messageWithUser.users = {
              id: user.id,
              email: user.email,
              username: userProfile?.username || user.email.split('@')[0],
              avatar_url: userProfile?.avatar_url || 'avatar-01'
            };
          } else {
            // NUEVO: Si es de otro usuario, consultar su información en la base de datos
            try {
              const { data: userData, error } = await supabase
                .from('users')
                .select('id, email, username, avatar_url')
                .eq('id', payload.new.user_id)
                .single();
              
              if (!error && userData) {
                messageWithUser.users = userData;
              } else {
                // Fallback si no se encuentra el usuario
                messageWithUser.users = {
                  id: payload.new.user_id,
                  email: 'unknown_user',
                  username: 'unknown_user',
                  avatar_url: 'avatar-01'
                };
              }
            } catch (err) {
              // Fallback en caso de error de red o consulta
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
            
            // MEJORADO: Ahora agrega el mensaje con información completa del usuario
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
  }, [currentChannel?.id, user?.id, userProfile]); // AGREGADO: userProfile como dependencia

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

  return (
    <div 
      className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-br ${theme.colors.bg}`}
      style={{
        background: currentTheme === 'coolRetro' ? '#000000' : undefined
      }}
    >
      <div className="w-full max-w-4xl h-screen p-4 flex flex-col relative mx-auto">
        
        <ChatHeader
          currentChannel={currentChannel}
          theme={theme}
          currentTheme={currentTheme}
          user={user}
          userProfile={userProfile}
          t={t}
          onOpenProfile={handleOpenProfile}
          onLogout={handleLogout}
        />

        <ConnectionStatus
          user={user}
          theme={theme}
          t={t}
        />

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

        {error && (
          <div className="mt-2 p-3 bg-red-900 border border-red-600 text-red-100 rounded-lg text-sm font-mono">
            Error: {error}
          </div>
        )}
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