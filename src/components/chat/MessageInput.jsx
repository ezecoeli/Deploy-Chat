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
  onSendMessage,
  isEncrypted = false,
}) {
  const [newMessage, setNewMessage] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const getTerminalPrompt = () => {
    const username = userProfile?.username || user?.email?.split('@')[0] || 'user';
    const isSmallScreen = windowWidth < 640;
    
    if (isSmallScreen) {
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
          return '% ';
        default:
          return '$ ';
      }
    }

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
        return `${username}: % `;
      default:
        return `${username}@deploy-chat:~$ `;
    }
  };

  const handleInputChange = (value) => {
    const stringValue = value || '';
    setNewMessage(stringValue);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const messageText = newMessage || '';
    if (!messageText.trim() || !currentChannel || !user) return;

    try {
      if (isEncrypted && onSendMessage) {
        await onSendMessage(messageText.trim());
      } else {
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
      }
      
      setNewMessage('');
    } catch (err) {
      onError?.('Error sending message: ' + err.message);
    }
  };

  const getThemePlaceholder = (currentTheme, t) => {
    const placeholders = {
      default: t('typeMessage') || "Type a message...",
      windows95: "echo Hello World!",   
      matrix: "echo 'Follow the white rabbit...'", 
      ubuntu: "echo 'Ubuntu means humanity'",        
      macOS: "echo 'Think Different'",               
      coolRetro: "DIR *.EXE",
    };
    
    const basePlaceholder = placeholders[currentTheme] || "echo 'Hello World!'";
    return basePlaceholder;
  };

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
      <form onSubmit={sendMessage} className="flex gap-1 sm:gap-2 font-mono items-stretch"> 
        <div 
          className="flex-1 px-2 sm:px-3 py-2 rounded-lg relative min-w-0"
          style={{ 
            backgroundColor: currentTheme === 'coolRetro' ? '#000000' : 'rgba(0,0,0,0.5)', 
            border: `1px solid ${theme.colors.border}`,
            maxWidth: 'calc(100% - 80px)'
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
          title={t('send')}
          disabled={!newMessage?.trim() || !currentChannel}
          className={`px-3 sm:px-6 py-2 rounded-lg transition-colors duration-200 text-sm sm:text-base flex-shrink-0 min-w-[60px] sm:min-w-[80px] ${ 
            currentTheme === 'default' ? 'font-medium' : 'font-mono'
          } ${currentTheme === 'windows95' ? 'windows95-button' : ''} ${theme.colors.button} cursor-pointer`}
          style={{
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