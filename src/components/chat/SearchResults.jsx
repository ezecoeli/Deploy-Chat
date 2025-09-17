import React from 'react';
import { getAvatarById } from '../../config/avatars';
import { FiUser } from 'react-icons/fi';
import MessageRenderer from './MessageRenderer';
import { useTranslation } from '../../hooks/useTranslation';

export default function SearchResults({ 
  results, 
  onSelectMessage, 
  theme, 
  currentTheme, 
  searchQuery 
}) {
  const { t } = useTranslation();
  const renderAvatar = (avatarUrl, username, size = 'w-6 h-6') => {
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
    return <FiUser className={`${size} text-gray-400`} />;
  };

  const highlightSearchTerm = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-400 text-black px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const getResultStyles = () => {
    switch (currentTheme) {
      case 'matrix':
        return {
          container: 'bg-black/80 border-green-500/30 hover:bg-green-500/10',
          text: 'text-green-400',
          meta: 'text-green-600'
        };
      case 'coolRetro':
        return {
          container: 'bg-black/80 border-cyan-400/30 hover:bg-cyan-400/10',
          text: 'text-cyan-400',
          meta: 'text-cyan-600'
        };
      case 'windows95':
        return {
          container: 'bg-gray-200 border-gray-400 hover:bg-blue-100',
          text: 'text-black',
          meta: 'text-gray-600'
        };
      default:
        return {
          container: 'bg-gray-800/80 border-gray-600 hover:bg-gray-700/50',
          text: 'text-white',
          meta: 'text-gray-400'
        };
    }
  };

  const styles = getResultStyles();

  const handleMessageClick = (message, event) => {
    // visual feedback
    const messageElement = event.currentTarget;
    messageElement.style.transform = 'scale(0.98)';
    messageElement.style.opacity = '0.7';
    
    setTimeout(() => {
      messageElement.style.transform = 'scale(1)';
      messageElement.style.opacity = '1';
      onSelectMessage(message);
    }, 150);
  };

  if (results.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className={`text-center ${styles.text}`}>
          <p className="font-mono">{t("noSearchResults")}</p>
          <p className="text-sm opacity-70 mt-1">{t("tryDifferentTerms")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {results.map((message) => (
        <div
          key={message.id}
          onClick={(e) => handleMessageClick(message, e)}
          className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${styles.container}`}
          style={{ transform: 'scale(1)', opacity: '1' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center flex-shrink-0">
              {renderAvatar(message.users?.avatar_url, message.users?.username)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-bold text-sm ${styles.text}`}>
                  {message.users?.username || message.users?.email}
                </span>
                <span className={`text-xs ${styles.meta}`}>
                  {t("in")} #{message.channels?.name}
                </span>
                <span className={`text-xs ${styles.meta}`}>
                  {new Date(message.created_at).toLocaleDateString()} {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
              
              <div className={`text-sm ${styles.text} font-mono`}>
                {searchQuery ? (
                  <div className="break-words">
                    {highlightSearchTerm(message.content, searchQuery)}
                  </div>
                ) : (
                  <MessageRenderer content={message.content} currentTheme={currentTheme} />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}