import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import TerminalInput from '../ui/TerminalInput';

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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const typingTimeoutRef = useRef(null);

  // Detect window resize for responsive prompt
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Get terminal prompt based on theme and user
  const getTerminalPrompt = () => {
    const username = userProfile?.username || user?.email?.split('@')[0] || 'user';
    const isSmallScreen = windowWidth < 640;
    
    if (isSmallScreen) {
      // Shortened prompts for mobile
      switch (currentTheme) {
        case 'matrix':
          return 'neo$ ';
        case 'coolRetro':
          return 'A> ';
        case 'ubuntu':
          return '~$ ';
        case 'windows95':
          return 'C:\> ';
        case 'macOS':
          return '$ ';
        default:
          return '$ ';
      }
    }

    // Full prompts for desktop
    switch (currentTheme) {
      case 'matrix':
        return `neo>: `;
      case 'coolRetro':
        return `${username}: A>`;
      case 'ubuntu':
        return `${username}:~$ `;
      case 'windows95':
        return `${username}: C:\> `;
      case 'macOS':
        return `${username}: ⌘ `;
      default:
        return `${username}@deploy-chat:~$ `;
    }
  };

  const handleInputChange = (value) => {
    // Ensure value is always a string
    const stringValue = value || '';
    setNewMessage(stringValue);

    if (stringValue.trim() && !isTyping) {
      setIsTyping(true);
      
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
      onTypingChange?.(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      
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
      onTypingChange?.(false);
    }, 1000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const messageText = newMessage || '';
    if (!messageText.trim() || !currentChannel || !user) return;

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
            content: messageText.trim(),
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

  const getThemePlaceholder = (currentTheme, t) => {
    const placeholders = {
      default: t('typeMessage') || "Escribe un mensaje...",
      windows95: "echo Hello World!",   
      matrix: "echo 'Follow the white rabbit...'", 
      ubuntu: "echo 'Ubuntu means humanity'",        
      macOS: "echo 'Think Different'",               
      coolRetro: "DIR *.EXE",
    };
    
    const basePlaceholder = placeholders[currentTheme] || "echo 'Hello World!'";
    return basePlaceholder;
  };

  // Cleanup effect for typing timeout
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="border-t px-2 py-3 sm:p-4"
      style={{
        borderColor: theme.colors.border,
        backgroundColor: currentTheme === 'matrix' || currentTheme === 'coolRetro' 
          ? 'transparent' 
          : 'rgba(0, 0, 0, 0.3)',
      }}
    >
      <form onSubmit={sendMessage} className="flex gap-1 sm:gap-2 font-mono items-center"> 
        {/* Terminal Input Container */}
        <div 
          className="flex-1 px-2 sm:px-3 py-2 rounded-lg relative"
          style={{ 
            backgroundColor: currentTheme === 'coolRetro' ? '#000000' : 'rgba(0,0,0,0.5)', 
            border: `1px solid ${theme.colors.border}` 
          }}
        >
          <TerminalInput
            value={newMessage}
            onChange={handleInputChange}
            currentTheme={currentTheme}
            prompt={getTerminalPrompt()}
            placeholder={getThemePlaceholder(currentTheme, t)}
            disabled={!currentChannel}
            className="w-full"
          />

          {/* Character counter for long messages */}
          {(newMessage?.length || 0) > 500 && (
            <div 
              className="absolute -top-6 right-0 text-xs"
              style={{ color: theme.colors.accent }}
            >
              {newMessage?.length || 0}/2000
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!newMessage?.trim() || !currentChannel}
          className={`px-3 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base flex-shrink-0 self-start ${ 
            currentTheme === 'default' ? 'font-medium' : 'font-mono'
          } ${currentTheme === 'windows95' ? 'windows95-button' : ''} ${theme.colors.button}`}
          style={{
            marginTop: '2px',
            transition: 'none'
          }}
        >
          <span className="hidden sm:inline">
            {currentTheme === 'default' ? t('send') : t('execute')}
          </span>
          <span className="sm:hidden">
            {currentTheme === 'default' ? '→' : '>'}
          </span>
        </button>
      </form>
      
    </div>
  );
}