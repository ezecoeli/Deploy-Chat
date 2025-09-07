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

  // Cargar perfil del usuario
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadMemberCount(); 
    }
  }, [user]);

  // Aplicar fuente del tema al body
  useEffect(() => {
    document.body.style.fontFamily = theme.font;
    return () => {
      document.body.style.fontFamily = '';
    };
  }, [theme.font]);

  // Función para cargar cantidad de miembros
  const loadMemberCount = async () => {
    try {
      console.log('Cargando contador de miembros...');
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      
      console.log('Cantidad de miembros cargada:', count);
      setMemberCount(count || 0);
    } catch (error) {
      console.error('Error loading member count:', error);
      setMemberCount(0);
    }
  };

  // Suscribirse a cambios en la tabla users para actualizar contador en tiempo real
  useEffect(() => {
    if (!user) return;

    console.log('Iniciando suscripción a cambios de usuarios');
    
    const userSubscription = supabase
      .channel('users_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, (payload) => {
        console.log('Cambio en tabla users detectado:', payload.eventType);
        // Recargar contador cuando hay cambios
        loadMemberCount();
      })
      .subscribe((status) => {
        console.log('Estado de suscripción users:', status);
      });

    return () => {
      console.log('Limpiando suscripción de usuarios');
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
      console.error('Error loading user profile:', error);
      // Fallback a datos del auth
      setUserProfile({
        username: user.email.split('@')[0],
        avatar_url: 'avatar-01' // Avatar por defecto
      });
    }
  };

  const handleProfileUpdated = (updatedProfile) => {
    setUserProfile(updatedProfile);
    // Recargar mensajes para actualizar avatares en el chat
    if (currentChannel?.id) {
      loadMessages(currentChannel.id);
    }
  };

  const renderAvatar = (avatarUrl, username, size = 'w-8 h-8') => {
    // Si es un avatar pre-cargado
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
    
    // Si es una URL personalizada
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

  // Detectar cambios de conectividad
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online');
      console.log('Conectado a internet');
    };
    
    const handleOffline = () => {
      setConnectionStatus('offline');
      console.log('Sin conexión a internet');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setConnectionStatus('away');
        console.log('Usuario ausente (pestaña oculta)');
      } else if (navigator.onLine) {
        setConnectionStatus('online');
        console.log('Usuario de vuelta (pestaña activa)');
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

  // Función para cargar mensajes
  const loadMessages = useCallback(async (channelId) => {
    if (!channelId) {
      console.log('No se puede cargar mensajes: channelId no válido');
      return;
    }

    try {
      console.log('Recargando mensajes para canal:', channelId);
      const { data, error } = await supabase
        .from('messages')
        .select(`*, users:user_id (*)`)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      console.log('Mensajes recargados:', data?.length || 0);
      setMessages(data || []);
    } catch (err) {
      console.error('Error recargando mensajes:', err);
      setError('Error cargando mensajes: ' + err.message);
    }
  }, []);

  // Configurar canal inicial y cargar mensajes
  useEffect(() => {
    console.log('Chat useEffect - loading:', loading, 'user:', user?.email, 'currentChannel:', currentChannel?.name);
    
    if (loading) {
      console.log('Auth aún cargando, esperando...');
      return;
    }

    if (!user) {
      console.log('No hay usuario, limpiando estado');
      setCurrentChannel(null);
      setMessages([]);
      return;
    }

    // PREVENIR EJECUCIONES MÚLTIPLES
    if (currentChannel) {
      console.log('Canal ya establecido, saltando inicialización');
      return;
    }

    // Solo establecer canal una vez al inicializar
    const hardcodedChannel = {
      id: '95cd8c81-bd3f-4cf2-a9d1-ce8f0c53486c',
      name: 'general',
    };

    console.log('Estableciendo canal inicial para usuario:', user.email);
    setCurrentChannel(hardcodedChannel);
    
    // Cargar mensajes una sola vez
    const loadInitialMessages = async () => {
      try {
        console.log('Cargando mensajes iniciales...');
        const { data, error } = await supabase
          .from('messages')
          .select(`*, users:user_id (*)`)
          .eq('channel_id', hardcodedChannel.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) throw error;

        console.log('Mensajes iniciales cargados:', data?.length || 0);
        setMessages(data || []);
      } catch (err) {
        console.error('Error cargando mensajes iniciales:', err);
        setError('Error cargando mensajes: ' + err.message);
      }
    };

    loadInitialMessages();
  }, [user, loading, currentChannel]);

  // Auto-scroll a nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Suscribirse a nuevos mensajes en tiempo real
  useEffect(() => {
    if (!currentChannel?.id || !user) {
      console.log('No hay canal o usuario para suscripción');
      return;
    }

    console.log('Iniciando suscripción a canal:', currentChannel.id);
    
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
          console.log('Nuevo mensaje recibido:', payload.new);
          
          setMessages(current => {
            const messageExists = current.some(msg => msg.id === payload.new.id);
            if (messageExists) {
              console.log('Mensaje ya existe, ignorando');
              return current;
            }
            
            return [...current, {
              ...payload.new,
              users: payload.new.user_id === user.id ? user : null
            }];
          });
        })
        .subscribe((status) => {
          console.log('Estado de suscripción:', status);
          
          // Reintentar en caso de error
          if (status === 'CHANNEL_ERROR' && retryCount < maxRetries) {
            retryCount++;
            console.log(`Reintentando suscripción (${retryCount}/${maxRetries})...`);
            setTimeout(() => {
              subscription.unsubscribe();
              createSubscription();
            }, 2000 * retryCount); 
          }
        });
        
      return subscription;
    };

    const subscription = createSubscription();
    console.log('Suscrito a mensajes del canal:', currentChannel.id);

    return () => {
      console.log('Limpiando suscripción del canal:', currentChannel.id);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [currentChannel?.id, user?.id]);

  // Función para obtener el estado visual de conexión
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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChannel || !user) return;

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
      console.error('Error enviando mensaje:', err);
      setError('Error enviando mensaje: ' + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Error en logout:', err);
      setError('Error cerrando sesión');
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div 
    className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-br ${theme.colors.bg}`}
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
            <div className="relative">
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
                    Online
                  </p>
                </div>
                <FiChevronDown className={`w-3 h-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <>
                  <div className="absolute right-0 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-3">
                      {/* Header del dropdown */}
                      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-600">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
                          {renderAvatar(userProfile?.avatar_url || 'avatar-01', userProfile?.username || user?.email)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {userProfile?.username || user?.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-400">
                            {user?.email}
                          </p>
                        </div>
                      </div>

                      {/* Opciones del menú */}
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setShowProfileModal(true);
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded text-sm transition-colors text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                        >
                          <FiUser className="w-4 h-4" />
                          <span>{t('editProfile') || 'Editar perfil'}</span>
                        </button>
                        
                        <hr className="border-gray-600 my-2" />
                        
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded text-sm transition-colors text-red-400 hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <FiLogOut className="w-4 h-4" />
                          <span>{t('logout') || 'Cerrar sesión'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                </>
              )}
            </div>
          </div>
        </header>

        {/* contador de miembros con tema */}
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
          {/* Estado de conexión  */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'online' ? 'animate-pulse' : ''
            }`} style={{ backgroundColor: theme.colors.statusOnline }}></div>
            <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
              {connectionStatus}
            </span>
          </div>
        </div>

        {/* Área de mensajes */}
        <div className={`flex-1 rounded-lg p-4 mb-4 overflow-y-auto ${theme.colors.message}`}>
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
                            backgroundColor: isOwnMessage ? theme.colors.accent + '20' : 'rgba(0,0,0,0.3)',
                            border: `1px solid ${theme.colors.border}`,
                            color: theme.colors.text
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
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Área de envío de mensajes */}
        <form onSubmit={sendMessage} className="flex gap-2 font-mono">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg" 
               style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: `1px solid ${theme.colors.border}` }}>
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
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={currentTheme === 'default' ? t('typeMessage') || "Escribe un mensaje..." : "echo 'Hello World!'"}
              className="flex-1 bg-gray-800 rounded-md p-1 outline-none placeholder-gray-500"
              style={{ color: theme.colors.text }}
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

      {/* Modal de perfil */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Cerrar dropdown si se hace clic fuera */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}