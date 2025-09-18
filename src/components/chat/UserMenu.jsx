import React, { useState, useRef, useEffect } from 'react';
import { FiUser, FiLogOut, FiChevronDown, FiGlobe, FiMonitor, FiSettings, FiActivity } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTerminalTheme } from '../../hooks/useTerminalTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { useDevStates } from '../../hooks/useDevStates';
import { getStateById } from '../../data/devStates';
import DevStatesSelector from './DevStatesSelector';

export default function UserMenu({ 
  user, 
  userProfile, 
  theme, 
  currentTheme, 
  t,
  onOpenProfile,
  onLogout 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showDevStates, setShowDevStates] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredTheme, setHoveredTheme] = useState(null);
  const userMenuRef = useRef(null);
  
  // Import theme and language hooks
  const { changeTheme, getThemesList, allThemes } = useTerminalTheme();
  const { language, changeLanguage } = useTranslation();
  const { currentStates } = useDevStates(user?.id);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
        setShowThemeSelector(false);
        setShowDevStates(false);
        setHoveredItem(null);
        setHoveredTheme(null);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showUserMenu]);

  // Close dropdowns with Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowThemeSelector(false);
        setShowDevStates(false);
        setHoveredItem(null);
        setHoveredTheme(null);
      }
    };

    if (showUserMenu) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showUserMenu]);

  const handleProfileClick = () => {
    onOpenProfile?.();
    setShowUserMenu(false);
    setHoveredItem(null);
  };

  const handleLogoutClick = () => {
    onLogout?.();
    setShowUserMenu(false);
    setHoveredItem(null);
  };

  const handleLanguageChange = () => {
    const newLang = language === 'es' ? 'en' : 'es';
    changeLanguage(newLang);
  };

  const handleThemeChange = (themeKey) => {
    changeTheme(themeKey);
    setShowThemeSelector(false);
    setHoveredTheme(null);
  };

  const getActiveStateDisplay = () => {
    if (currentStates.availability) {
      const stateData = getStateById('availability', currentStates.availability.id);
      if (stateData) {
        return {
          ...stateData,
          customMessage: currentStates.availability.customMessage,
          color: currentStates.availability.color
        };
      }
    }
    return null;
  };

  const activeState = getActiveStateDisplay();
  const themes = getThemesList();

  // Get menu styles based on current theme
  const getMenuStyles = () => {
    switch (currentTheme) {
      case 'coolRetro':
        return {
          background: 'rgba(0, 0, 0, 0.95)',
          border: '1px solid #ffb000',
          color: '#ffcc00',
          textShadow: '0 0 3px #ffb000'
        };
      case 'matrix':
        return {
          background: 'rgba(0, 0, 0, 0.95)',
          border: '1px solid #00ff00',
          color: '#00ff88',
          textShadow: '0 0 3px #00ff88'
        };
      case 'windows95':
        return {
          background: '#c0c0c0',
          border: '2px outset #c0c0c0',
          color: '#000000',
          textShadow: 'none'
        };
      case 'ubuntu':
        return {
          background: 'rgba(55, 55, 55, 0.95)',
          border: '1px solid #ff6600',
          color: '#ffaa66',
          textShadow: '0 0 2px #ff6600'
        };
      case 'macOS':
        return {
          background: 'rgba(255, 255, 255, 0.95)', 
          border: '1px solid #d1d5db', 
          color: '#374151',
          textShadow: 'none', 
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        };
      default:
        return {
          background: '#374151',
          border: '1px solid #4b5563',
          color: '#d1d5db',
          textShadow: 'none'
        };
    }
  };

  const menuStyles = getMenuStyles();

  const getHoverStyles = () => {
    switch (currentTheme) {
      case 'macOS':
        return {
          hoverBg: 'rgba(59, 130, 246, 0.1)',
          activeBg: 'rgba(59, 130, 246, 0.2)',
          logoutHover: 'rgba(239, 68, 68, 0.1)', 
          borderColor: '#d1d5db' 
        };
      case 'coolRetro':
        return {
          hoverBg: 'rgba(255, 176, 0, 0.2)',
          activeBg: 'rgba(255, 176, 0, 0.3)',
          logoutHover: 'rgba(255, 153, 153, 0.2)',
          borderColor: '#ffb000'
        };
      case 'matrix':
        return {
          hoverBg: 'rgba(0, 255, 0, 0.2)',
          activeBg: 'rgba(0, 255, 0, 0.3)',
          logoutHover: 'rgba(255, 85, 85, 0.2)',
          borderColor: '#00ff00'
        };
      case 'ubuntu':
        return {
          hoverBg: 'rgba(255, 102, 0, 0.2)',
          activeBg: 'rgba(255, 102, 0, 0.3)',
          logoutHover: 'rgba(255, 102, 102, 0.2)',
          borderColor: '#ff6600'
        };
      default:
        return {
          hoverBg: 'rgba(75, 85, 99, 0.5)',
          activeBg: 'rgba(59, 130, 246, 0.3)',
          logoutHover: 'rgba(153, 27, 27, 0.2)',
          borderColor: '#6b7280'
        };
    }
  };

  const hoverStyles = getHoverStyles();

  return (
    <div className="relative" ref={userMenuRef}>
      {/* User Button with State Indicator */}
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${theme.colors.input} hover:opacity-80 relative`}
        title={t('menu')}
        style={{ 
          color: theme.colors.text,
          fontFamily: theme.font 
        }}
      >
        <div className="hidden sm:block text-left relative">
          <p className="text-sm font-medium">
            <FiSettings className='w-6 h-6 flex-shrink-0' />
          </p>
          {/* Status indicator */}
          {activeState && (
            <div 
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2"
              style={{ 
                backgroundColor: activeState.color,
                borderColor: theme.colors.background
              }}
              title={activeState.customMessage || activeState.label}
            />
          )}
        </div>
        <motion.div
          animate={{ rotate: showUserMenu ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showUserMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute right-0 mt-1 w-64 rounded-lg shadow-lg"
            style={{ 
              zIndex: currentTheme === 'coolRetro' ? 52000 : 50,
              ...menuStyles,
              ...(currentTheme === 'macOS' && {
                backdropFilter: 'blur(10px)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              })
            }}
          >
            <div className="p-3">
              {/* Active Status Display */}
              {activeState && (
                <div className="mb-3 pb-3 border-b" style={{ borderColor: hoverStyles.borderColor }}>
                  <div className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: activeState.color }}
                    />
                    <span style={{ color: menuStyles.color }}>
                      {activeState.customMessage || activeState.label}
                    </span>
                  </div>
                </div>
              )}

              {/* Developer Status Option */}
              <button
                onClick={() => setShowDevStates(!showDevStates)}
                className="w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center gap-2"
                style={{ 
                  color: menuStyles.color,
                  textShadow: menuStyles.textShadow,
                  backgroundColor: showDevStates ? hoverStyles.activeBg : 
                    (hoveredItem === 'devStates' ? hoverStyles.hoverBg : 'transparent')
                }}
                onMouseEnter={() => setHoveredItem('devStates')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FiActivity className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{t('status')}</span>
                <motion.div
                  animate={{ rotate: showDevStates ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown className="w-3 h-3" />
                </motion.div>
              </button>

              {/* Developer States Selector */}
              <AnimatePresence>
                {showDevStates && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="ml-2 mt-2 overflow-hidden"
                  >
                    <DevStatesSelector
                      user={user}
                      currentTheme={currentTheme}
                      className="max-w-none border-0 p-0 bg-transparent"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Profile Option */}
              <button
                onClick={handleProfileClick}
                className="w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center gap-2"
                style={{ 
                  color: menuStyles.color,
                  textShadow: menuStyles.textShadow,
                  backgroundColor: hoveredItem === 'profile' ? hoverStyles.hoverBg : 'transparent'
                }}
                onMouseEnter={() => setHoveredItem('profile')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FiUser className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{t('editProfile')}</span>
                {userProfile?.username || user?.email?.split('@')[0]}
              </button>

              {/* Language Selector */}
              <button
                onClick={handleLanguageChange}
                className="w-full text-xs text-left px-3 py-2 rounded transition-colors flex items-center gap-2"
                style={{ 
                  color: menuStyles.color,
                  textShadow: menuStyles.textShadow,
                  backgroundColor: hoveredItem === 'language' ? hoverStyles.hoverBg : 'transparent'
                }}
                onMouseEnter={() => setHoveredItem('language')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FiGlobe className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{t('language')}</span>
                <div className="flex justify-end">
                  <span 
                    className="text-xs px-2 py-1 rounded border" 
                    style={{ 
                      borderColor: hoverStyles.borderColor,
                      backgroundColor: currentTheme === 'macOS' ? 'rgba(243, 244, 246, 0.8)' : 'transparent',
                      color: currentTheme === 'macOS' ? '#374151' : menuStyles.color
                    }}
                  >
                    {language === 'es' ? 'ES 🇪🇸' : 'EN 🇬🇧'} 
                  </span>
                </div>
              </button>

              {/* Theme Selector */}
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className="w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center gap-2"
                style={{ 
                  color: menuStyles.color,
                  textShadow: menuStyles.textShadow,
                  backgroundColor: hoveredItem === 'theme' ? hoverStyles.hoverBg : 'transparent'
                }}
                onMouseEnter={() => setHoveredItem('theme')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FiMonitor className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{t('theme') || 'Theme'}</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ 
                      backgroundColor: theme?.colors?.accent || '#3b82f6',
                      borderColor: hoverStyles.borderColor
                    }}
                  />
                  <span className="text-xs">{theme.name}</span>
                  <motion.div
                    animate={{ rotate: showThemeSelector ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronDown className="w-3 h-3" />
                  </motion.div>
                </div>
              </button>

              {/* Theme List */}
              <AnimatePresence>
                {showThemeSelector && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="ml-6 mt-2 space-y-1 max-h-40 overflow-y-auto"
                  >
                    {themes.map((themeOption) => {
                      const isActive = currentTheme === themeOption.key;
                      const themeConfig = allThemes[themeOption.key];
                      
                      return (
                        <button
                          key={themeOption.key}
                          onClick={() => handleThemeChange(themeOption.key)}
                          className="w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center gap-2"
                          style={{
                            color: isActive ? 
                              (currentTheme === 'macOS' ? '#1d4ed8' : '#ffffff') : 
                              menuStyles.color,
                            backgroundColor: isActive 
                              ? (currentTheme === 'macOS' ? 'rgba(59, 130, 246, 0.15)' : 
                                currentTheme === 'coolRetro' ? 'rgba(255, 176, 0, 0.3)' : 
                                'rgba(59, 130, 246, 0.3)')
                              : hoveredTheme === themeOption.key ? hoverStyles.hoverBg : 'transparent',
                            textShadow: currentTheme === 'macOS' ? 'none' : menuStyles.textShadow
                          }}
                          onMouseEnter={() => !isActive && setHoveredTheme(themeOption.key)}
                          onMouseLeave={() => setHoveredTheme(null)}
                        >
                          <div 
                            className="w-2 h-2 rounded-full border"
                            style={{ 
                              backgroundColor: themeConfig?.colors?.accent || '#3b82f6',
                              borderColor: hoverStyles.borderColor 
                            }}
                          />
                          <span className="flex-1">{themeOption.name}</span>
                          {isActive && <span className="text-xs">●</span>}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Divider */}
              <hr 
                className="my-2"
                style={{ 
                  borderColor: currentTheme === 'macOS' ? '#e5e7eb' : 
                    (currentTheme === 'coolRetro' ? '#ffb000' : 
                    currentTheme === 'ubuntu' ? '#ff6600' : 
                    '#4b5563') 
                }}
              />
              
              {/* Logout */}
              <button
                onClick={handleLogoutClick}
                className="w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center gap-2"
                style={{ 
                  color: currentTheme === 'macOS' ? '#dc2626' : (currentTheme === 'coolRetro' ? '#ff9999' : '#ef4444'),
                  textShadow: currentTheme === 'macOS' ? 'none' : (currentTheme === 'coolRetro' ? '0 0 3px #ff6666' : 'none'),
                  backgroundColor: hoveredItem === 'logout' ? hoverStyles.logoutHover : 'transparent'
                }}
                onMouseEnter={() => setHoveredItem('logout')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FiLogOut className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{t('logout')}</span>
              </button>

              {/* Footer */}
              <div 
                className="mt-3 pt-2 border-t" 
                style={{ 
                  borderColor: currentTheme === 'macOS' ? '#e5e7eb' : 
                    (currentTheme === 'coolRetro' ? '#ffb000' : 
                    currentTheme === 'ubuntu' ? '#ff6600' : 
                    '#4b5563')
                }}
              >
                <p 
                  className="text-xs font-mono text-center"
                  style={{ 
                    color: currentTheme === 'macOS' ? '#9ca3af' : (currentTheme === 'coolRetro' ? '#cc8800' : '#9ca3af'),
                    textShadow: currentTheme === 'macOS' ? 'none' : (currentTheme === 'coolRetro' ? '0 0 2px #ffb000' : 'none')
                  }}
                >
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}