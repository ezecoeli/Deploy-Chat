import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from './LanguageToggle';

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

export default function Chat() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadGeneralChannel();
    
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          console.log('Nuevo mensaje recibido:', payload.new);
          setMessages(current => [...current, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadGeneralChannel = async () => {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('name', 'general')
      .single();
    
    if (error) {
      console.error('Error loading general channel:', error);
      setError('Error cargando el canal general');
    } else {
      console.log('Canal general:', data);
      setCurrentChannel(data);
      await loadMessages(data.id);
    }
  };

  const loadMessages = async (channelId) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users:user_id (*)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error loading messages:', error);
      setError('Error cargando mensajes');
    } else {
      console.log('Mensajes cargados:', data);
      setMessages(data || []);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error during logout:', error);
      setError('Error al cerrar sesión');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentChannel) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            content: message.trim(),
            user_id: user.id,
            channel_id: currentChannel.id
          }
        ]);

      if (error) throw error;
      
      setMessage('');
      setError(null);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Error enviando mensaje');
    }
  };

  return (
    <div className="w-full max-w-4xl h-screen p-4 flex flex-col relative">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>

      {/* Header */}
      <header className="flex justify-between items-center mb-4 pr-20">
        <div className="flex items-center gap-2">
          <img 
            src={user?.user_metadata?.avatar_url || DEFAULT_AVATAR} 
            alt="avatar" 
            className="w-10 h-10 rounded-full"
          />
          <span className="text-white">{user?.email}</span>
        </div>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {t('logout')}
        </button>
      </header>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500 text-white p-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center">{t('noMessages')}</p>
        ) : (
          messages.map(msg => (
            <div 
              key={msg.id} 
              className={`flex items-start gap-2 mb-4 ${
                msg.user_id === user.id ? 'flex-row-reverse' : ''
              }`}
            >
              <img
                src={msg.users?.avatar_url || DEFAULT_AVATAR}
                alt="avatar"
                className="w-8 h-8 rounded-full"
              />
              <div className={`max-w-[70%] ${
                msg.user_id === user.id ? 'bg-green-700' : 'bg-gray-700'
              } rounded-lg p-2`}>
                <p className="text-sm text-gray-300">
                  {msg.users?.username || msg.users?.email}
                </p>
                <p className="text-white">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('messageInput')}
          className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          {t('sendMessage')}
        </button>
      </form>
    </div>
  );
}