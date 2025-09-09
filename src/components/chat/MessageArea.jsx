import React, { useRef, useEffect } from 'react';
import { getAvatarById } from '../../config/avatars';
import { FiUser } from 'react-icons/fi';
import MessageRenderer from './MessageRenderer';

export default function MessageArea({ 
  messages, 
  user, 
  theme, 
  currentTheme, 
  typingUsers,
  t 
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to get scrollbar class based on theme
  const getScrollbarClass = () => {
    switch (currentTheme) {
      case 'matrix':
        return 'matrix-scrollbar';
      case 'windows95':
        return 'windows95-scrollbar';
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

  const renderAvatar = (avatarUrl, username, size = 'w-8 h-8') => {
    // if is a preloaded avatar
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

    // If it's a custom URL
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

  return (
    <div 
      className={`flex-1 overflow-y-auto p-4 space-y-3 ${getScrollbarClass()}`}
      style={{
        
        backgroundColor: currentTheme === 'matrix' || currentTheme === 'coolRetro' 
          ? 'transparent' 
          : 'rgba(0, 0, 0, 0.3)',
        fontFamily: theme.font,
        color: theme.colors.text,
        ...(currentTheme === 'windows95' && {
          borderLeft: '4px solid #c0c7c8'
        })
      }}
    >
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
                          {messageUser.username || messageUser.email}
                        </span>
                        <span style={{ color: theme.colors.textSecondary }}>
                          :{theme.prompt}
                        </span>
                      </div>
                    )}
                    <div 
                      className="px-3 py-2 rounded"
                      style={{ 
                        backgroundColor: currentTheme === 'matrix' 
                          ? isOwnMessage 
                            ? 'rgba(0, 255, 0, 0.15)'
                            : 'rgba(0, 100, 0, 0.3)'
                          : isOwnMessage 
                          ? 'rgba(230, 160, 0, 0.1)' 
                          : 'rgba(0,0,0,0.4)', 
                        border: currentTheme === 'matrix' 
                          ? `1px solid ${isOwnMessage ? '#00ff00' : '#004400'}` 
                          : `1px solid ${currentTheme === 'coolRetro' ? '#664400' : theme.colors.border}`,
                        color: theme.colors.text,
                        textShadow: currentTheme === 'coolRetro' 
                          ? '0 0 3px #e6a000'
                          : currentTheme === 'matrix'
                          ? '0 0 2px #00ff00'
                          : 'none'
                      }}
                    >
                      <MessageRenderer content={message.content} />
                      <p className="text-xs mt-1 opacity-70">
                        // {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* users typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 opacity-70">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span 
                className="text-xs font-mono"
                style={{ color: theme.colors.textSecondary }}
              >
                {typingUsers.length === 1 
                  ? `${typingUsers[0].username} está escribiendo...`
                  : `${typingUsers.length} usuarios están escribiendo...`
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