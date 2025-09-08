import React, { useState, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';

export default function MessageInput({ 
  currentChannel, 
  user, 
  userProfile, 
  theme, 
  currentTheme, 
  t,
  onError,
  onTypingChange 
}) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

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

      // Notify parent component about typing status
      onTypingChange?.(true);
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

      // Notify parent component about typing status
      onTypingChange?.(false);
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
    onTypingChange?.(false);

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
    } catch (err) {
      onError?.('Error enviando mensaje: ' + err.message);
    }
  };

  // Clean up typing timeout on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
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
  );
}