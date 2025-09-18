import React, { useRef, useEffect } from 'react';
import { FiUser } from 'react-icons/fi';
import MessageRenderer from './MessageRenderer';
import ReactionBar from '../ReactionBar';
import { useTranslation } from '../../hooks/useTranslation';
import { usePinnedMessages } from '../../hooks/usePinnedMessages';
import { usePermissions } from '../../hooks/usePermissions';
import { useDevStatesContext } from '../../hooks/useDevStatesContext';
import PinnedMessagesBar from './PinnedMessagesBar';
import PinButton from './PinButton';
import UserAvatar from './UserAvatar';
import { getAvatarById, getDefaultAvatar } from '../../config/avatars';

export default function MessageArea({ 
  messages, 
  user, 
  theme, 
  currentTheme, 
  typingUsers = [],
  currentChannel
}) {
  const messagesEndRef = useRef(null);
  const { t } = useTranslation();
  const { isAdmin, isModerator } = usePermissions(user);
  const { allUserStates } = useDevStatesContext();
  const canPin = isAdmin || isModerator;

  const {
    pinnedMessages,
    pinMessage,
    unpinMessage,
    canPinMore
  } = usePinnedMessages(currentChannel?.id);

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

  const renderMessageAvatar = (message) => {
    const messageUser = message.users || { 
      email: 'unknown_user',
      username: 'unknown_user',
      avatar_url: null
    };

    let avatarUrl = messageUser.avatar_url;
    
    if (!avatarUrl) {
      avatarUrl = getDefaultAvatar().src;
    } else if (avatarUrl.startsWith('avatar-')) {
      const avatar = getAvatarById(avatarUrl);
      avatarUrl = avatar ? avatar.src : getDefaultAvatar().src;
    }

    return (
      <UserAvatar 
        user={{
          id: message.user_id,
          avatar_url: avatarUrl,
          username: messageUser.username,
          email: messageUser.email
        }}
        size="md"
        showStates={true}
      />
    );
  };

  const handlePinMessage = async (messageId) => {
    return await pinMessage(messageId, user.id);
  };

  const handleUnpinMessage = async (messageId) => {
    return await unpinMessage(messageId);
  };

  const handlePinnedMessageClick = (message) => {
    const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 3000);
    }
  };

  const isMessagePinned = (messageId) => {
    return pinnedMessages.some(pinnedMsg => pinnedMsg.id === messageId);
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
    <div className="flex-1 flex flex-col min-h-0">
      <PinnedMessagesBar
        pinnedMessages={pinnedMessages}
        onUnpinMessage={handleUnpinMessage}
        onMessageClick={handlePinnedMessageClick}
        user={user}
        theme={theme}
        currentTheme={currentTheme}
      />

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
              const isPinned = isMessagePinned(message.id);
              
              return (
                <div
                  key={message.id}
                  data-message-id={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className={`flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-xs lg:max-w-md xl:max-w-lg ${
                    isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    {!isOwnMessage && (
                      <div className="flex-shrink-0">
                        {renderMessageAvatar(message)}
                      </div>
                    )}
                    
                    <div className="font-mono min-w-0 flex-1 relative">
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
                          {isPinned && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1 rounded font-mono">
                              {t('pinned')}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="relative">
                        {canPin && (
                          <div className={`absolute z-10 ${isOwnMessage ? '-left-10' : '-right-10'} top-0`}>
                            <PinButton
                              message={message}
                              isPinned={isPinned}
                              onPin={handlePinMessage}
                              onUnpin={handleUnpinMessage}
                              canPinMore={canPinMore}
                              theme={theme}
                              currentTheme={currentTheme}
                            />
                          </div>
                        )}

                        <div 
                          className={`px-2 py-1 sm:px-3 sm:py-2 rounded text-sm sm:text-base ${
                            canPin ? (isOwnMessage ? 'mr-8' : 'ml-8') : ''
                          }`}
                          style={{ 
                            backgroundColor: currentTheme === 'matrix' 
                              ? isOwnMessage 
                                ? 'rgba(0, 255, 0, 0.2)'
                                : 'rgba(0, 100, 0, 0.5)'
                              : isOwnMessage 
                              ? 'rgba(230, 160, 0, 0.1)' 
                              : 'rgba(0,0,0,0.4)', 
                            border: isPinned 
                              ? '1px solid rgba(255, 193, 7, 0.5)'
                              : currentTheme === 'matrix' 
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
                      </div>

                      {isOwnMessage && isPinned && (
                        <div className="flex items-center justify-end mt-1">
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1 rounded font-mono">
                            {t('pinned')}
                          </span>
                        </div>
                      )}

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
    </div>
  );
}