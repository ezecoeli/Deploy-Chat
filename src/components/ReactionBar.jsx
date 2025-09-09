import React, { useState } from 'react';
import { useReactions, DEVELOPER_REACTIONS } from '../hooks/useReactions';

export default function ReactionBar({ messageId, userId, currentTheme, isOwnMessage = false }) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState('classic');
  
  const {
    reactions,
    loading,
    toggleReaction,
    getTotalReactions,
    getReactionCount,
    hasUserReacted
  } = useReactions(messageId, userId);

  const handleReactionClick = async (emoji) => {
    setShowPicker(false);
    // Only allow reacting to other users' messages
    if (!isOwnMessage) {
      await toggleReaction(emoji);
    }
  };

  const getEmojisByCategory = (category) => {
    return Object.entries(DEVELOPER_REACTIONS).filter(
      ([key, data]) => data.category === category
    );
  };

  const getThemeStyles = () => {
    switch (currentTheme) {
      case 'matrix':
        return {
          button: 'hover:bg-green-500/20 border-green-500/30',
          active: 'bg-green-500/30 border-green-400',
          text: 'text-green-400',
          picker: 'bg-black/95 border-green-500/50'
        };
      case 'coolRetro':
        return {
          button: 'hover:bg-yellow-500/20 border-yellow-600/30',
          active: 'bg-yellow-500/30 border-yellow-400',
          text: 'text-yellow-400',
          picker: 'bg-black/95 border-yellow-600/50'
        };
      default:
        return {
          button: 'hover:bg-gray-600/20 border-gray-600/30',
          active: 'bg-blue-500/30 border-blue-400',
          text: 'text-gray-300',
          picker: 'bg-gray-800/95 border-gray-600/50'
        };
    }
  };

  const themeStyles = getThemeStyles();
  const hasReactions = getTotalReactions() > 0;

  const categories = [
    { id: 'classic', label: '😂', title: 'Classic' },
    { id: 'modern', label: '🔥', title: 'Modern' },
    { id: 'gesture', label: '👏', title: 'Gestures' }
  ];

  if (!userId) {
    return null;
  }

  
  return (
    <div className="flex items-center gap-1 mt-1 relative">
      {/* Always show existing reactions  */}
      {hasReactions && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(reactions).map(([emoji, users]) => (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              disabled={loading || isOwnMessage}
              className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
                border transition-all duration-200 hover:scale-105
                ${hasUserReacted(emoji) 
                  ? `${themeStyles.active} ${themeStyles.text}` 
                  : `${themeStyles.button} ${themeStyles.text}`
                }
                ${loading || isOwnMessage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={`${users.length} reaction${users.length !== 1 ? 's' : ''}`}
            >
              <span className="text-sm">{emoji}</span>
              <span className="font-mono text-xs">{users.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* Only show add button for other users' messages */}
      {!isOwnMessage && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            disabled={loading}
            className={`
              p-1 rounded-full border transition-all duration-200
              ${themeStyles.button} ${themeStyles.text}
              hover:scale-110 text-xs
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title="Add reaction"
          >
            ➕
          </button>

          {/* Picker with categories */}
          {showPicker && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowPicker(false)}
              />
              
              <div className={`
                absolute bottom-full left-0 mb-2 rounded-lg border z-20
                ${themeStyles.picker}
                shadow-lg backdrop-blur-sm w-64
              `}>
                {/* Category tabs */}
                <div className="flex border-b border-gray-600/50">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`
                        flex-1 p-2 text-center text-xs border-b-2 transition-colors
                        ${activeCategory === category.id 
                          ? `${themeStyles.text} border-current` 
                          : 'text-gray-500 border-transparent hover:text-gray-300'}
                      `}
                      title={category.title}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                {/* Grid of emojis */}
                <div className="p-2">
                  <div className="grid grid-cols-6 gap-1">
                    {getEmojisByCategory(activeCategory).map(([key, { emoji, label }]) => (
                      <button
                        key={key}
                        onClick={() => handleReactionClick(emoji)}
                        disabled={loading}
                        className={`
                          p-2 rounded-lg transition-all duration-200 hover:scale-125
                          ${themeStyles.button}
                          ${hasUserReacted(emoji) ? themeStyles.active : ''}
                          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        title={label}
                      >
                        <span className="text-lg">{emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}