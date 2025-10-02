import React, { useState } from 'react';
import UserMenu from './UserMenu';
import NotesModal from '../ui/NotesModal';
import BotEventModal from '../ui/BotEventModal';
import SearchModal from '../ui/SearchModal';
import { BsCalendarEvent, BsSearch  } from "react-icons/bs";
import { LuNotebookText } from "react-icons/lu";
import { usePermissions } from '../../hooks/usePermissions';

export default function ChatHeader({ 
  currentChannel, 
  theme, 
  currentTheme, 
  user, 
  userProfile, 
  t,
  onOpenProfile,
  onLogout,
  isPrivateMode,
  onNavigateToMessage
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [showBotModal, setShowBotModal] = useState(false);
  const { isAdmin, isModerator } = usePermissions(user);
  const [showSearch, setShowSearch] = useState(false);

  const canProgramBot = (isAdmin || isModerator) && currentChannel?.name === 'events';

  const getChannelDisplayName = () => {
    if (!currentChannel) return 'Deploy Chat';
    
    if (isPrivateMode) {
      if (currentChannel.otherUser) {
        return `@${currentChannel.otherUser.username || currentChannel.otherUser.email?.split('@')[0] || 'Usuario'}`;
      }
      return '@Chat Privado';
    }
    
    return `#${currentChannel.name}`;
  };

  return (
    <div 
      className="border p-2 flex justify-between items-center"
      style={{
        borderColor: currentTheme === 'matrix' 
          ? 'rgba(0, 255, 0, 0.3)'
          : currentTheme === 'windows95'
          ? '#c0c7c8'
          : theme.colors.border,
        backgroundColor: currentTheme === 'windows95' 
          ? theme.colors.headerBg || '#000080'
          : currentTheme === 'macOS'
          ? theme.colors.titleBar || '#c0c0c0'
          : currentTheme === 'matrix' || currentTheme === 'coolRetro' 
          ? 'transparent' 
          : 'rgba(0, 0, 0, 0.3)',
      }}
    >
      <div>
        <p className="text-lg animate-pulse font-mono" style={{ color: theme.colors.textSecondary, fontFamily: theme.font }}>
          {theme.prompt} cd {getChannelDisplayName()}
        </p>
        {/*{isPrivateMode && currentChannel && (
          <div className="flex items-center gap-1 text-xs">
            <span style={{ color: theme.colors.textSecondary }}>
              {t('privateChat')}
            </span>
          </div>
        )}*/}
      </div>

      <div className="flex items-center gap-4">
        {currentChannel && (
          <button
            className="p-2 rounded hover:bg-green-600 transition text-green-600 hover:text-white"
            title={t("searchMessages")}
            onClick={() => setShowSearch(true)}
          >
            <BsSearch className="w-5 h-5" />
          </button>
        )}

        {canProgramBot && (
          <button
            className="animate-bounce p-2 rounded brightness-150 hover:bg-cyan-600 transition text-cyan-500 hover:text-white"
            title={t("scheduleEvent")}
            onClick={() => setShowBotModal(true)}
          >
            <BsCalendarEvent className="w-6 h-6" />
          </button>
        )}

        <button
          className="p-2 rounded hover:bg-blue-600 transition text-blue-600 hover:text-white"
          title={t("notes")}
          onClick={() => setShowNotes(true)}
        >
          <LuNotebookText className="w-6 h-6" />
        </button>

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

      <NotesModal
        open={showNotes}
        onClose={() => setShowNotes(false)}
        theme={theme}
        currentTheme={currentTheme}
      />

      <BotEventModal
        isOpen={showBotModal}
        onClose={() => setShowBotModal(false)}
        channelId={currentChannel?.id}
        userId={user?.id}
        theme={theme}
        currentTheme={currentTheme}
      />

      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        user={user}
        theme={theme}
        currentTheme={currentTheme}
        onNavigateToMessage={onNavigateToMessage}
      />
    </div>
  );
}