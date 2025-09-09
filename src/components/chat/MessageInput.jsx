import React, { useState, useRef, useEffect } from 'react';
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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // detect window resize for responsive prompt
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // 6 lines approximately
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [newMessage]);
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (value.trim() && !isTyping) {
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

  // Handle key combinations
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter = new line 
        return;
      } else {
        // Enter = send message
        e.preventDefault();
        sendMessage(e);
      }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChannel || !user) return;

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

  // Responsive prompt 
  const getResponsivePrompt = () => {
    const username = userProfile?.username || user?.email?.split('@')[0];
    const isSmallScreen = windowWidth < 640;
    
    if (isSmallScreen) {
      // Shortened prompts for mobile
      switch (currentTheme) {
        case 'matrix':
          return 'Neo>';
        case 'ubuntu':
          return '~$';
        case 'windows95':
          return 'C:>';
        case 'macOS':
          return '%';
        case 'coolRetro':
          return 'C>';
        default:
          return '$';
      }
    }
    
    // Full prompts for desktop
    return `${username}:${theme.prompt}`;
  };

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
      <form onSubmit={sendMessage} className="flex gap-1 sm:gap-2 font-mono items-start"> 
        <div 
          className="flex-1 flex items-start gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg relative"
          style={{ 
            backgroundColor: currentTheme === 'coolRetro' ? '#000000' : 'rgba(0,0,0,0.5)', 
            border: `1px solid ${theme.colors.border}` 
          }}
        >
          <span 
            className="px-1 sm:px-2 py-1 rounded-md font-medium flex-shrink-0 text-xs sm:text-sm"
            style={{ 
              color: theme.colors.accent,
              backgroundColor: `${theme.colors.accent}15`,
              border: `1px solid ${theme.colors.accent}30`,
              alignSelf: 'flex-start',
              marginTop: '2px',
            }}
          >
            {getResponsivePrompt()}
          </span>
          
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={getThemePlaceholder(currentTheme, t)}
            className="flex-1 rounded-lg pl-1 outline-none text-sm sm:text-base resize-none"
            style={{ 
              color: theme.colors.text,
              background: currentTheme === 'coolRetro' ? '#324345' : '#171717',
              border: currentTheme === 'coolRetro' ? '1px solid #664400' : 'none',
              textShadow: currentTheme === 'coolRetro' ? '0 0 2px #e6a000' : 'none',
              fontFamily: currentTheme === 'coolRetro' ? '"Courier New", monospace' : 'inherit',
              minHeight: '28px',
              maxHeight: '120px',
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              paddingTop: '4px',
              paddingBottom: '4px',
              overflow: 'hidden',
              overflowY: 'auto', 
            }}
            disabled={!currentChannel}
            rows={1} 
          />

          {/* Character counter for long messages */}
          {newMessage.length > 500 && (
            <div 
              className="absolute -top-6 right-0 text-xs"
              style={{ color: theme.colors.accent }}
            >
              {newMessage.length}/2000
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!newMessage.trim() || !currentChannel}
          className={`px-3 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base flex-shrink-0 self-start ${ 
            currentTheme === 'default' ? 'font-medium' : 'font-mono'
          } ${theme.colors.button}`}
          style={{
            marginTop: '2px',
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