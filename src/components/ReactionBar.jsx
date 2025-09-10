import React, { useState, useEffect, useRef } from 'react';
import { useReactions, DEVELOPER_REACTIONS } from '../hooks/useReactions';
import { BsEmojiSmile } from "react-icons/bs";

export default function ReactionBar({ messageId, userId, currentTheme, isOwnMessage = false }) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState('classic');
  const pickerRef = useRef(null);
  const overlayRef = useRef(null);
  
  const {
    reactions,
    loading,
    toggleReaction,
    getTotalReactions,
    hasUserReacted
  } = useReactions(messageId, userId);

  // Handle clicks outside the picker - special handling for coolRetro
  useEffect(() => {
    if (!showPicker) return;

    const handleClickOutside = (event) => {
      // Special handling for coolRetro theme
      if (currentTheme === 'coolRetro') {
        // Check if click is outside picker container
        if (pickerRef.current && !pickerRef.current.contains(event.target)) {
          event.preventDefault();
          event.stopPropagation();
          setShowPicker(false);
        }
      } else {
        // Normal handling for other themes
        if (pickerRef.current && !pickerRef.current.contains(event.target)) {
          setShowPicker(false);
        }
      }
    };

    // Add event listener with capture for coolRetro
    const useCapture = currentTheme === 'coolRetro';
    document.addEventListener('mousedown', handleClickOutside, useCapture);
    document.addEventListener('touchstart', handleClickOutside, useCapture);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, useCapture);
      document.removeEventListener('touchstart', handleClickOutside, useCapture);
    };
  }, [showPicker, currentTheme]);

  // Close picker on Escape key
  useEffect(() => {
    if (!showPicker) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowPicker(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showPicker]);

  const handleReactionClick = async (emoji) => {
    setShowPicker(false);
    // Only allow reacting to other users' messages
    if (!isOwnMessage) {
      await toggleReaction(emoji);
    }
  };

  const getEmojisByCategory = (category) => {
    return Object.entries(DEVELOPER_REACTIONS).filter(
      ([, data]) => data.category === category
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
      {/* Always show existing reactions */}
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
                ${loading || isOwnMessage ? 'cursor-not-allowed' : 'cursor-pointer'}
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
            <BsEmojiSmile className='text-lg' />
          </button>

          {/* Picker with categories */}
          {showPicker && (
            <>
              {/* Background overlay */}
              <div 
                ref={overlayRef}
                className="fixed inset-0"
                style={{ 
                  zIndex: currentTheme === 'coolRetro' ? 9999 : 100,
                  backgroundColor: 'transparent',
                  cursor: 'default',
                  pointerEvents: 'all'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPicker(false);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPicker(false);
                }}
              />
              
              <div 
                ref={pickerRef}
                className={`
                  absolute bottom-full left-0 mb-2 rounded-lg border
                  ${themeStyles.picker}
                  shadow-lg backdrop-blur-sm w-64
                `}
                style={{
                  zIndex: currentTheme === 'coolRetro' ? 10000 : 101,
                  position: 'absolute',
                  // Force specific styles for coolRetro theme
                  ...(currentTheme === 'coolRetro' && {
                    backgroundColor: 'rgba(0, 0, 0, 0.98)',
                    border: '2px solid #e6a000',
                    boxShadow: '0 0 20px rgba(230, 160, 0, 0.5), inset 0 0 20px rgba(230, 160, 0, 0.1)',
                    transform: 'translateZ(0)',
                  })
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {/* Category tabs */}
                <div className="flex border-b border-gray-600/50">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveCategory(category.id);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
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
                    {getEmojisByCategory(activeCategory).map(([emojiKey, { emoji, label }]) => (
                      <button
                        key={emojiKey}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleReactionClick(emoji);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        disabled={loading}
                        className={`
                          p-2 rounded-lg transition-all duration-200 hover:scale-125
                          ${themeStyles.button}
                          ${hasUserReacted(emoji) ? themeStyles.active : ''}
                          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        title={label}
                        style={{
                          // Force hover styles for coolRetro
                          ...(currentTheme === 'coolRetro' && {
                            backgroundColor: hasUserReacted(emoji) 
                              ? 'rgba(230, 160, 0, 0.3)' 
                              : 'rgba(230, 160, 0, 0.1)',
                            border: `1px solid ${hasUserReacted(emoji) ? '#e6a000' : 'rgba(230, 160, 0, 0.3)'}`,
                          })
                        }}
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