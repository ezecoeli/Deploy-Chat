import React from 'react';
import { BsPinAngleFill, BsX } from 'react-icons/bs';
import { getAvatarById } from '../../config/avatars';
import { FiUser } from 'react-icons/fi';
import { useTranslation } from '../../hooks/useTranslation';
import { usePermissions } from '../../hooks/usePermissions';

export default function PinnedMessagesBar({ 
  pinnedMessages, 
  onUnpinMessage, 
  user, 
  theme, 
  currentTheme,
  onMessageClick 
}) {
  const { t } = useTranslation();
  const { isAdmin, isModerator } = usePermissions(user);
  const canUnpin = isAdmin || isModerator;

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

  const getBarStyles = () => {
    switch (currentTheme) {
      case 'matrix':
        return {
          container: 'bg-green-900/20 border-green-500/50 text-green-400',
          message: 'bg-green-800/30 border-green-500/30 hover:bg-green-700/40',
          button: 'text-green-400 hover:text-green-300 hover:bg-green-500/20'
        };
      case 'coolRetro':
        return {
          container: 'bg-cyan-900/20 border-cyan-400/50 text-cyan-400',
          message: 'bg-cyan-800/30 border-cyan-400/30 hover:bg-cyan-700/40',
          button: 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/20'
        };
      case 'ubuntu':
        return {
          container: 'bg-orange-900/20 border-orange-400/50 text-orange-200',
          message: 'bg-orange-800/30 border-orange-400/30 hover:bg-orange-700/40',
          button: 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/20'
        };
      case 'windows95':
        return {
          container: 'bg-blue-100 border-blue-300 text-black',
          message: 'bg-white border-gray-300 hover:bg-blue-50',
          button: 'text-gray-600 hover:text-black hover:bg-gray-200'
        };
      case 'macOS':
        return {
          container: 'bg-blue-50 border-blue-200 text-gray-800',
          message: 'bg-white border-gray-200 hover:bg-blue-25',
          button: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        };
      default:
        return {
          container: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-200',
          message: 'bg-yellow-800/30 border-yellow-500/30 hover:bg-yellow-700/40',
          button: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20'
        };
    }
  };

  const styles = getBarStyles();

  if (!pinnedMessages || pinnedMessages.length === 0) {
    return null;
  }

  const truncateMessage = (content, maxLength = 80) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className={`border-b p-3 ${styles.container}`} style={{ borderColor: theme.colors.border }}>
      <div className="flex items-center gap-2 mb-2">
        <BsPinAngleFill className="w-4 h-4" />
        <span className="text-sm font-bold font-mono">
          {t("pinnedMessages")} ({pinnedMessages.length}/2)
        </span>
      </div>
      
      <div className="space-y-2">
        {pinnedMessages.map((message) => (
          <div
            key={message.id}
            className={`border rounded p-2 cursor-pointer transition-all ${styles.message}`}
            onClick={() => onMessageClick && onMessageClick(message)}
          >
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center flex-shrink-0">
                {renderAvatar(message.users?.avatar_url, message.users?.username)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold">
                    {message.users?.username || message.users?.email}
                  </span>
                  <span className="text-xs opacity-70">
                    {new Date(message.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-sm font-mono break-words">
                  {truncateMessage(message.content)}
                </p>
              </div>
              
              {canUnpin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnpinMessage(message.id);
                  }}
                  className={`p-1 rounded transition-colors ${styles.button}`}
                  title={t("unpinMessage")}
                >
                  <BsX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}