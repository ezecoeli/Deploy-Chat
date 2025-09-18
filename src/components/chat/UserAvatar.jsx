import React from 'react';
import { useDevStatesContext } from '../../hooks/useDevStatesContext';
import { getStateById } from '../../data/devStates';
import { getAvatarById, getDefaultAvatar } from '../../config/avatars';
import { useTranslation } from '../../hooks/useTranslation';

export default function UserAvatar({ 
  user, 
  size = 'md', 
  showStates = true,
  className = '',
  onClick
}) {
  const { allUserStates } = useDevStatesContext();
  const { t } = useTranslation();

  const currentStates = allUserStates[user?.id] || {
    work: null,
    mood: null,
    availability: null
  };

  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const indicatorSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2', 
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5'
  };

  const getAvatarUrl = () => {
    if (!user?.avatar_url) {
      return getDefaultAvatar().src;
    }
    
    if (user.avatar_url.startsWith('avatar-')) {
      const avatar = getAvatarById(user.avatar_url);
      return avatar ? avatar.src : getDefaultAvatar().src;
    }
    
    return user.avatar_url;
  };

  const getActiveState = () => {
    for (const category of ['availability', 'work', 'mood']) {
      if (currentStates?.[category]) {
        const stateData = getStateById(category, currentStates[category].id, t);
        if (stateData) {
          return {
            ...stateData,
            color: currentStates[category].color,
            category: category
          };
        }
      }
    }
    return null;
  };

  const activeState = getActiveState();
  const avatarUrl = getAvatarUrl();

  const getTooltipText = () => {
    const username = user?.username || user?.email || 'Usuario';
    if (showStates && activeState) {
      return `${username} - ${activeState.label}`;
    }
    return username;
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      title={getTooltipText()}
      onClick={onClick}
    >
      <img
        src={avatarUrl}
        alt={user?.username || user?.email || 'User Avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity`}
        onError={(e) => {
          const defaultAvatar = getDefaultAvatar();
          if (e.target.src !== defaultAvatar.src) {
            e.target.src = defaultAvatar.src;
          }
        }}
      />

      {showStates && activeState && (
        <div 
          className={`absolute -bottom-0.5 -right-0.5 ${indicatorSizes[size]} rounded-full border-2 border-gray-800`}
          style={{ backgroundColor: activeState.color }}
          title={`${activeState.label}`}
        />
      )}
    </div>
  );
}