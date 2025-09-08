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
    <header className="flex justify-between items-center mb-4">
      <div>
        <h1 
          className="text-2xl font-bold font-mono"
          style={{ 
            color: theme.colors.primary,
            textShadow: theme.effects.textShadow 
          }}
        >
          Deploy Chat
        </h1>
        <p 
          className="text-sm font-mono"
          style={{ color: theme.colors.textSecondary }}
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