import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from './LanguageToggle';

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

export default function Chat() {
  const { user, logout, loading } = useAuth();
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [error, setError] = useState(null);
  const [isSending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const realtimeChannel = useRef(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState('online');

  useEffect(() => {
    // Detectar cambios de conectividad
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionStatus('online');
      console.log('🟢 Conectado a internet');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus('offline');
      console.log('🔴 Sin conexión a internet');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setConnectionStatus('away');
        console.log('🟡 Usuario ausente (pestaña oculta)');
      } else if (navigator.onLine) {
        setConnectionStatus('online');
        console.log('🟢 Usuario de vuelta (pestaña activa)');
      }
    };

    // listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(async (channelId) => {
    if (!channelId) {
      console.log('⚠️ No se puede cargar mensajes: channelId no válido');
      return;
    }
    
    try {
      console.log('📥 Cargando mensajes para canal:', channelId);
      const { data, error } = await supabase
        .from('messages')
        .select(`*, users:user_id (*)`)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);
        
      if (error) throw error;

      console.log('✅ Mensajes cargados:', data?.length || 0);
      setMessages(data || []);
    } catch (err) {
      console.error('❌ Error cargando mensajes:', err);
      setError('Error cargando mensajes: ' + err.message);
    }
  }, []);

  // Manejar canal inicial (sin loadMessages en dependencies)
  useEffect(() => {
    if (!loading && user && !currentChannel) {
      const hardcodedChannel = {
        id: '95cd8c81-bd3f-4cf2-a9d1-ce8f0c53486c',
        name: 'general',
      };
      
      console.log('🎯 Estableciendo canal inicial');
      setCurrentChannel(hardcodedChannel);
    }
  }, [user, loading, currentChannel]);

  // Cargar mensajes cuando cambie el canal 
  useEffect(() => {
    if (currentChannel?.id) {
      console.log('📨 Cargando mensajes para canal:', currentChannel.id);
      loadMessages(currentChannel.id);
    }
  }, [currentChannel?.id]); // Solo currentChannel.id, NO loadMessages

  // Limpiar cuando no hay usuario
  useEffect(() => {
    if (!loading && !user) {
      console.log('🧹 Limpiando estado sin usuario');
      setCurrentChannel(null);
      setMessages([]);
    }
  }, [user, loading]);

  useEffect(() => {
    if (!currentChannel?.id || !user) return;

    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
    }

    realtimeChannel.current = supabase
      .channel(`messages-channel-${currentChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${currentChannel.id}`,
        },
        (payload) => {
          console.log('Mensaje recibido via real-time:', payload.new);

          const newMessage = {
            ...payload.new,
            users: payload.new.user_id === user.id ? {
              id: user.id,
              email: user.email,
              username: user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url
            } : {
              id: payload.new.user_id,
              email: 'Usuario',
              username: 'Usuario',
              avatar_url: null
            }
          };

          setMessages((currentMessages) => {
            const messageExists = currentMessages.some((msg) => msg.id === newMessage.id);
            if (messageExists) {
              return currentMessages;
            }
            const updatedMessages = [...currentMessages, newMessage];
            return updatedMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          });
        }
      )
      .subscribe((status) => {
        console.log('Estado de suscripción real-time:', status);
      });

    return () => {
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
        realtimeChannel.current = null;
      }
    };
  }, [currentChannel?.id, user]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, scrollToBottom]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentChannel || !user || isSending) return;

    setSending(true);
    const messageContent = message.trim();
    setMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          content: messageContent,
          user_id: user.id,
          channel_id: currentChannel.id
        }]);

      if (error) throw error;
      setError(null);
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      setError('Error enviando mensaje: ' + err.message);
      setMessage(messageContent);
    } finally {
      setSending(false);
    }
  }, [message, currentChannel, user, isSending]);

  const handleInputChange = useCallback((e) => {
    setMessage(e.target.value);
  }, []);

  const messagesList = useMemo(() => {
    return messages.map(msg => (
      <div
        key={msg.id}
        className={`flex items-start gap-2 mb-4 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''
          }`}
      >
        <img
          src={msg.users?.avatar_url || DEFAULT_AVATAR}
          alt="avatar"
          className="w-8 h-8 rounded-full"
        />
        <div className={`max-w-[70%] ${msg.user_id === user?.id ? 'bg-green-700' : 'bg-gray-700'
          } rounded-lg p-2`}>
          <p className="text-sm text-gray-300">
            {msg.users?.username || msg.users?.email || 'Usuario'}
          </p>
          <p className="text-white">{msg.content}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(msg.created_at).toLocaleTimeString()}
          </p>
        </div>
      </div>
    ));
  }, [messages, user?.id]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl h-screen p-4 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // 
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'online':
        return {
          color: 'bg-green-500',
          text: t('online'),
          textColor: 'text-green-400'
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          text: t('offline'),
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

  const statusInfo = getStatusInfo();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="w-full max-w-4xl h-screen p-4 flex flex-col relative mx-auto">

        {/* Toggle de idioma */}
        <div className=" absolute top-4 right-4 z-10">
          <LanguageToggle />
        </div>

        {/* Header */}
        <header className="flex justify-between items-center mb-4 pr-20">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src={user?.user_metadata?.avatar_url || DEFAULT_AVATAR}
                alt="avatar"
                className="w-10 h-10 rounded-full"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
            </div>
            <span className="text-white">{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            {t('logout')}
          </button>
        </header>
        {error && (
          <div className="bg-red-500 text-white p-2 rounded mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 px-2 py-1 bg-red-700 rounded text-sm hover:bg-red-800"
            >
              ✕
            </button>
          </div>
        )}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            {currentChannel ? `#${currentChannel.name}` : 'Conectando...'}
          </p>

          {/* Estado dinámico de conexión */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 ${statusInfo.color} rounded-full ${connectionStatus === 'online' ? 'animate-pulse' : ''
              }`}></div>
            <span className={`text-sm ${statusInfo.textColor}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>
        <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center">{t('noMessages')}</p>
          ) : (
            messagesList
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder={isSending ? 'Enviando...' : t('messageInput')}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            disabled={!currentChannel || isSending}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!currentChannel || !message.trim() || isSending}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSending && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isSending ? 'Enviando...' : t('sendMessage')}
          </button>
        </form>
        {message.length > 400 && (
          <p className="text-xs text-gray-400 mt-1 text-right">
            {message.length}/500
          </p>
        )}
      </div>
    </div>
  );
}