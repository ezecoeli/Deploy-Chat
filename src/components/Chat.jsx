import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from './LanguageToggle';

export default function Chat() {
  const { user, logout, loading } = useAuth();
  const { t } = useTranslation();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentChannel, setCurrentChannel] = useState(null);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('online');
  const messagesEndRef = useRef(null);

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

    // Solo establecer canal una vez al inicializar
    if (!currentChannel) {
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
    }
  }, [user, loading]); // REMOVIDO currentChannel de dependencies

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

    const subscription = supabase
      .channel(`messages:${currentChannel.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${currentChannel.id}`
      }, (payload) => {
        console.log('Nuevo mensaje recibido:', payload.new);
        
        // Verificar que el mensaje no sea del usuario actual (evitar duplicados)
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
      });

    console.log('Suscrito a mensajes del canal:', currentChannel.id);

    return () => {
      console.log('Limpiando suscripción del canal:', currentChannel.id);
      subscription.unsubscribe();
    };
  }, [currentChannel?.id, user?.id]); // Dependencies específicas

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
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="w-full max-w-4xl h-screen p-4 flex flex-col relative mx-auto">
        
        {/* Toggle de idioma */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageToggle />
        </div>

        {/* Header */}
        <header className="flex justify-between items-center mb-4 pr-20">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {t('chat') || 'Chat'}
            </h1>
            <p className="text-gray-400 text-sm">
              {t('welcome')} {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
          >
            {t('logout') || 'Cerrar sesión'}
          </button>
        </header>

        <div className="mb-2 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            {currentChannel ? `#${currentChannel.name}` : 'Conectando...'}
          </p>
          
          {/* Estado dinámico de conexión */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 ${statusInfo.color} rounded-full ${
              connectionStatus === 'online' ? 'animate-pulse' : ''
            }`}></div>
            <span className={`text-sm ${statusInfo.textColor}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 bg-gray-800 rounded-lg p-4 mb-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>{t('noMessages') || 'No hay mensajes aún. ¡Sé el primero en escribir!'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwnMessage = message.user_id === user?.id;
                const messageUser = message.users || { email: 'Usuario desconocido' };
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      {!isOwnMessage && (
                        <p className="text-xs text-gray-400 mb-1">
                          {messageUser.email}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-blue-200' : 'text-gray-400'
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Área de envío de mensajes */}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('messageInput') || 'Escribe un mensaje...'}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!currentChannel}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !currentChannel}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
          >
            {t('sendMessage') || 'Enviar'}
          </button>
        </form>

        {error && (
          <div className="mt-2 p-3 bg-red-600 text-white rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}