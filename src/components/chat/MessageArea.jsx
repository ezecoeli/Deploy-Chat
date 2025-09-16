import React, { useRef, useEffect } from 'react';
import { getAvatarById } from '../../config/avatars';
import { FiUser } from 'react-icons/fi';
import MessageRenderer from './MessageRenderer';
import ReactionBar from '../ReactionBar';
import { useTranslation } from '../../hooks/useTranslation';

export default function MessageArea({ 
  messages, 
  user, 
  theme, 
  currentTheme, 
  typingUsers = [], 
}) {
  const messagesEndRef = useRef(null);
  const {t} = useTranslation();

  const safeMessages = Array.isArray(messages) ? messages : [];
  const safeTypingUsers = Array.isArray(typingUsers) ? typingUsers : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeMessages]);

  const getScrollbarClass = () => {
    switch (currentTheme) {
      case 'matrix':
        return 'matrix-scrollbar';
      case 'windows95':
        return 'windows95-scrollbar';
      case 'ubuntu':
        return 'ubuntu-scrollbar';
      case 'macOS':
        return 'mac-scrollbar';
      case 'coolRetro':
        return 'coolretro-scrollbar';
      case 'hackingMode':
        return 'hackingmode-scrollbar';
      case 'default':
        return 'default-scrollbar';
      default:
        return 'custom-scrollbar';
    }
  };

  const renderAvatar = (avatarUrl, username, size = 'w-6 h-6 sm:w-8 sm:h-8') => {
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
    
    return <FiUser className={`${size.replace('w-', '').replace('h-', '')} text-gray-400`} />;
  };

  
  if (!theme || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex-1 overflow-y-auto px-2 py-3 sm:p-4 space-y-2 sm:space-y-3 ${getScrollbarClass()}`}
      style={{
        backgroundColor: currentTheme === 'matrix' || currentTheme === 'coolRetro' 
          ? 'transparent' 
          : 'rgba(0, 0, 0, 0.3)',
        fontFamily: theme.font,
        color: theme.colors.text,
        ...(currentTheme === 'windows95' && {
          borderLeft: '2px solid #c0c7c8 sm:4px solid #c0c7c8'
        })
      }}
    >
      {safeMessages.length === 0 ? ( 
        <div className="text-center mt-4 sm:mt-8 px-4">
          <p 
            className={`${currentTheme === 'default' ? 'text-gray-500' : 'font-mono'} text-sm sm:text-base`}
            style={{ color: theme.colors.textSecondary }}
          >
            {currentTheme === 'default' 
              ? "No hay mensajes aún. ¡Sé el primero en escribir!"
              : `${theme.prompt} echo ${t('noMessagesYet')}`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {safeMessages.map((message) => {
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
                <div className={`flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-xs lg:max-w-md xl:max-w-lg ${
                  isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  {!isOwnMessage && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center flex-shrink-0">
                      {renderAvatar(messageUser.avatar_url, messageUser.username)}
                    </div>
                  )}
                  
                  <div className="font-mono min-w-0 flex-1">
                    {!isOwnMessage && (
                      <div className="flex items-center gap-1 mb-1 flex-wrap">
                        <span 
                          className="text-xs sm:text-sm font-semibold truncate"
                          style={{ color: theme.colors.accent }}
                        >
                          {messageUser.username || messageUser.email}
                        </span>
                        <span 
                          className="text-xs hidden sm:inline"
                          style={{ color: theme.colors.textSecondary }}
                        >
                          :{theme.prompt}
                        </span>
                      </div>
                    )}
                    <div 
                      className="px-2 py-1 sm:px-3 sm:py-2 rounded text-sm sm:text-base"
                      style={{ 
                        backgroundColor: currentTheme === 'matrix' 
                          ? isOwnMessage 
                            ? 'rgba(0, 255, 0, 0.2)'
                            : 'rgba(0, 100, 0, 0.5)'
                          : isOwnMessage 
                          ? 'rgba(230, 160, 0, 0.1)' 
                          : 'rgba(0,0,0,0.4)', 
                        border: currentTheme === 'matrix' 
                          ? `1px solid ${isOwnMessage ? '#00ff00' : '#004400'}` 
                          : `1px solid ${currentTheme === 'coolRetro' ? '#664400' : theme.colors.border}`,
                        color: currentTheme === 'matrix' 
                          ? '#00ff88'
                          : currentTheme === 'coolRetro' 
                          ? '#ffee44'
                          : '#ffffff',
                        textShadow: currentTheme === 'coolRetro' 
                          ? '0 0 4px #ffee44, 0 0 8px rgba(255, 238, 68, 0.5)'
                          : currentTheme === 'matrix'
                          ? '0 0 3px #00ff88, 0 0 6px rgba(0, 255, 136, 0.4)'
                          : '0 0 2px rgba(0, 0, 0, 0.8)',
                        wordBreak: 'break-word'
                      }}
                    >
                      <MessageRenderer content={message.content} currentTheme={currentTheme} />
                      <p className="text-xs mt-1 opacity-70">
                        // {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>

                    <ReactionBar 
                      messageId={message.id}
                      userId={user?.id}
                      currentTheme={currentTheme}
                      isOwnMessage={isOwnMessage}
                    />
                    
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {safeTypingUsers.length > 0 && ( 
            <div className="flex items-center gap-2 px-2 sm:px-3 py-2 opacity-70">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 animate-bounce" />
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span 
                className="text-xs font-mono"
                style={{ color: theme.colors.textSecondary }}
              >
                {safeTypingUsers.length === 1 
                  ? `${safeTypingUsers[0].username} ${window.innerWidth < 640 ? '...' : (t?.('isCoding') || 'is typing...')}`
                  : `${safeTypingUsers.length} usuarios escribiendo...`
                }
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}