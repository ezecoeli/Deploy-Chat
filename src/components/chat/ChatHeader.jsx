import React from 'react';
import UserMenu from './UserMenu';
import { BsShieldLock } from "react-icons/bs";

export default function ChatHeader({ 
  currentChannel, 
  theme, 
  currentTheme, 
  user, 
  userProfile, 
  t,
  onOpenProfile,
  onLogout,
  isPrivateMode 
}) {
  return (
    <div 
      className="border p-4 flex justify-between items-center"
      style={{
        borderColor: currentTheme === 'matrix' 
          ? 'rgba(0, 255, 0, 0.3)'
          : currentTheme === 'windows95'
          ? '#c0c7c8'
          : theme.colors.border,

        backgroundColor: currentTheme === 'windows95' 
          ? theme.colors.headerBg || '#000080' 
          : currentTheme === 'matrix' || currentTheme === 'coolRetro' 
          ? 'transparent' 
          : 'rgba(0, 0, 0, 0.3)',
      }}
    >
      <div>
        <h1 
          className="text-2xl font-bold font-mono"
          style={{ 
            color: currentTheme === 'windows95' ? theme.colors.headerText || '#ffffff' : theme.colors.primary,
            textShadow: currentTheme === 'windows95' ? 'none' : theme.effects.textShadow,
            fontFamily: theme.font
          }}
        >
          Deploy-Chat
        </h1>
        <p 
          className="text-sm font-mono"
          style={{ 
            color: currentTheme === 'windows95' ? theme.colors.headerText || '#ffffff' : theme.colors.textSecondary,
            fontFamily: theme.font
          }}
        >
          {currentChannel ? `${theme.prompt} cd #${currentChannel.name}` : 'Connecting...'}
        </p>

        {/* private mode indicator */}
        {isPrivateMode && (
          <div className="flex items-center gap-1 text-xs">
            <span style={{ color: theme.colors.textSecondary }}>
              <BsShieldLock className='w-5 h-5' />
            </span>
            <span style={{ color: theme.colors.textSecondary }}>
              {t('encrypted')}
            </span>
          </div>
        )}
      </div>
      
      {/* User Profile Section */}
      <div className="flex items-center gap-4">
        
        {/* User menu component */}
        <UserMenu
          user={user}
          userProfile={userProfile}
          theme={theme}
          currentTheme={currentTheme}
          t={t}
          onOpenProfile={onOpenProfile}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
}