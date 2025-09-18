import React from 'react';
import { useDevStates } from '../../hooks/useDevStates';
import { getStateById } from '../../data/devStates';
import { getAvatarById, getDefaultAvatar } from '../../config/avatars';

export default function UserAvatar({ 
  user, 
  size = 'md', 
  showStates = true,
  className = '',
  onClick
}) {
  const { currentStates } = useDevStates(user?.id);

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

  // Get correct avatar URL
  const getAvatarUrl = () => {
    if (!user?.avatar_url) {
      return getDefaultAvatar().src;
    }
    
    // If it's just an ID like 'avatar-01', get the full path
    if (user.avatar_url.startsWith('avatar-')) {
      const avatar = getAvatarById(user.avatar_url);
      return avatar ? avatar.src : getDefaultAvatar().src;
    }
    
    // If it's already a full URL/path, use it
    return user.avatar_url;
  };

  const getAvailabilityState = () => {
    if (currentStates?.availability) {
      const stateData = getStateById('availability', currentStates.availability.id);
      return {
        ...stateData,
        color: currentStates.availability.color,
        customMessage: currentStates.availability.customMessage
      };
    }
    return null;
  };

  const getWorkMoodState = () => {
    // Priority: work state over mood state
    if (currentStates?.work) {
      const stateData = getStateById('work', currentStates.work.id);
      return {
        ...stateData,
        color: currentStates.work.color,
        customMessage: currentStates.work.customMessage,
        type: 'work'
      };
    }
    
    if (currentStates?.mood) {
      const stateData = getStateById('mood', currentStates.mood.id);
      return {
        ...stateData,
        color: currentStates.mood.color,
        customMessage: currentStates.mood.customMessage,
        type: 'mood'
      };
    }
    
    return null;
  };

  const availabilityState = getAvailabilityState();
  const workMoodState = getWorkMoodState();

  const getTooltipText = () => {
    const states = [];
    
    if (availabilityState) {
      states.push(availabilityState.customMessage || availabilityState.label);
    }
    
    if (workMoodState) {
      states.push(workMoodState.customMessage || workMoodState.label);
    }
    
    return states.join(' • ');
  };

  const avatarUrl = getAvatarUrl();

  return (
    <div 
      className={`relative inline-block ${className}`}
      title={showStates && getTooltipText() ? getTooltipText() : user?.username || user?.email}
      onClick={onClick}
    >
      {/* Avatar Image */}
      <img
        src={avatarUrl}
        alt={user?.username || user?.email || 'User Avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity`}
        onError={(e) => {
          // Try default avatar as fallback
          const defaultAvatar = getDefaultAvatar();
          if (e.target.src !== defaultAvatar.src) {
            e.target.src = defaultAvatar.src;
          }
        }}
      />

      {showStates && (
        <>
          {/* Availability Status Indicator (bottom-right) */}
          {availabilityState && (
            <div 
              className={`absolute -bottom-0.5 -right-0.5 ${indicatorSizes[size]} rounded-full border-2 border-gray-800`}
              style={{ backgroundColor: availabilityState.color }}
              title={availabilityState.customMessage || availabilityState.label}
            />
          )}

          {/* Work/Mood State Indicator (top-right) */}
          {workMoodState && (
            <div 
              className={`absolute -top-0.5 -right-0.5 ${indicatorSizes[size]} rounded-full border-2 border-gray-800`}
              style={{ backgroundColor: workMoodState.color }}
              title={workMoodState.customMessage || workMoodState.label}
            />
          )}
        </>
      )}
    </div>
  );
}