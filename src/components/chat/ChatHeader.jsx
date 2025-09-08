import React from 'react';
import ThemeSelector from '../ThemeSelector';
import UserMenu from './UserMenu';

export default function ChatHeader({ 
  currentChannel, 
  theme, 
  currentTheme, 
  user, 
  userProfile, 
  t,
  onOpenProfile,
  onLogout 
}) {
  return (
    <header 
      className={`flex justify-between items-center mb-4 ${
        currentTheme === 'msdos' ? 'p-2 border border-[c0c7c8]' : ''
      }`}
      style={{
        backgroundColor: currentTheme === 'msdos' ? theme.colors.headerBg : 'transparent',
        fontFamily: theme.font
      }}
    >
      <div>
        <h1 
          className="text-2xl font-bold font-mono"
          style={{ 
            color: currentTheme === 'msdos' ? theme.colors.headerText : theme.colors.primary,
            textShadow: currentTheme === 'msdos' ? 'none' : theme.effects.textShadow,
            fontFamily: theme.font
          }}
        >
          Deploy Chat
        </h1>
        <p 
          className="text-sm font-mono"
          style={{ 
            color: currentTheme === 'msdos' ? theme.colors.headerText : theme.colors.textSecondary,
            fontFamily: theme.font
          }}
        >
          {currentChannel ? `${theme.prompt} cd #${currentChannel.name}` : 'Connecting...'}
        </p>
      </div>
      
      {/* User Profile Section */}
      <div className="flex items-center gap-4">
        <ThemeSelector />
        
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
    </header>
  );
}