import React, { useState, useRef, useEffect } from 'react';
import { getAvatarById } from '../../config/avatars';
import { FiUser, FiLogOut, FiChevronDown, FiGlobe, FiMonitor, FiSettings } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTerminalTheme } from '../../hooks/useTerminalTheme';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageToggle from '../LanguageToggle';

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
  const userMenuRef = useRef(null);
  
  // Import theme and language hooks
  const { changeTheme, getThemesList, allThemes } = useTerminalTheme();
  const { language, changeLanguage } = useTranslation();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
        setShowThemeSelector(false);
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
      }
    };

    if (showUserMenu) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showUserMenu]);

  const renderAvatar = (avatarUrl, username, size = 'w-8 h-8') => {
    // If is a preloaded avatar
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

    // If it's a custom URL
    if (avatarUrl && !avatarUrl.startsWith('avatar-')) {
      return (
        <img 
          src={avatarUrl} 
          alt={`Avatar de ${username}`}
          className={`${size} rounded-full object-cover`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    // Fallback
    return <FiUser className={`${size.replace('w-', '').replace('h-', '')} text-gray-400`} />;
  };

  const handleProfileClick = () => {
    onOpenProfile?.();
    setShowUserMenu(false);
  };

  const handleLogoutClick = () => {
    onLogout?.();
    setShowUserMenu(false);
  };

  const handleLanguageChange = () => {
    const newLang = language === 'es' ? 'en' : 'es';
    changeLanguage(newLang);
  };

  const handleThemeChange = (themeKey) => {
    changeTheme(themeKey);
    setShowThemeSelector(false);
  };

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

  return (
    <div className="relative " ref={userMenuRef}>
      {/* User Button */}
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${theme.colors.input} hover:opacity-80`}
        style={{ 
          color: theme.colors.text,
          fontFamily: theme.font 
        }}
      >
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium">
            <FiSettings className='w-6 h-6 flex-shrink-0' />
          </p>
        </div>
        <motion.div
          animate={{ rotate: showUserMenu ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown className="w-3 h-3" />
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
              ...menuStyles
            }}
          >
            <div className="p-3">

              {/* Profile Option */}
              <button
                onClick={handleProfileClick}
                className="w-full text-left px-3 py-2 rounded text-xs transition-colors hover:bg-gray-700 flex items-center gap-2"
                style={{ 
                  color: menuStyles.color,
                  textShadow: menuStyles.textShadow,
                  backgroundColor: 'transparent'
                }}
              >
                <FiUser className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{t('editProfile')}</span>
                {userProfile?.username || user?.email?.split('@')[0]}
              </button>

              {/* Language Selector */}
              <button
                onClick={handleLanguageChange}
                className="w-full text-xs text-left px-3 py-2 rounded transition-colors hover:bg-gray-700 flex items-center gap-2"
                style={{ 
                  color: menuStyles.color,
                  textShadow: menuStyles.textShadow,
                  backgroundColor: 'transparent'
                }}
              >
                <FiGlobe className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{t('language')}</span>

                <div className="flex justify-end">
                   <LanguageToggle className="text-xs" />
                </div>
              </button>

              {/* Theme Selector */}
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className="w-full text-left px-3 py-2 rounded text-xs transition-colors hover:bg-gray-700 flex items-center gap-2"
                style={{ 
                  color: menuStyles.color,
                  textShadow: menuStyles.textShadow,
                  backgroundColor: 'transparent'
                }}
              >
                <FiMonitor className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{t('theme') || 'Theme'}</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-500"
                    style={{ backgroundColor: theme?.colors?.accent || '#3b82f6' }}
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
                          className="w-full text-left px-2 py-1 rounded text-xs transition-colors hover:bg-gray-600 flex items-center gap-2"
                          style={{
                            color: isActive ? '#ffffff' : menuStyles.color,
                            backgroundColor: isActive 
                              ? (currentTheme === 'coolRetro' ? 'rgba(255, 176, 0, 0.3)' : 'rgba(59, 130, 246, 0.3)')
                              : 'transparent',
                            textShadow: menuStyles.textShadow
                          }}
                        >
                          <div 
                            className="w-2 h-2 rounded-full border border-gray-500"
                            style={{ backgroundColor: themeConfig?.colors?.accent || '#3b82f6' }}
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
                style={{ borderColor: menuStyles.border.split(' ')[2] }}
              />
              
              {/* Logout */}
              <button
                onClick={handleLogoutClick}
                className="w-full text-left px-3 py-2 rounded text-xs transition-colors hover:bg-red-900/20 flex items-center gap-2"
                style={{ 
                  color: currentTheme === 'coolRetro' ? '#ff9999' : '#ef4444',
                  textShadow: currentTheme === 'coolRetro' ? '0 0 3px #ff6666' : 'none',
                  backgroundColor: 'transparent'
                }}
              >
                <FiLogOut className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{t('logout')}</span>
              </button>

              {/* Footer */}
              <div className="mt-3 pt-2 border-t" style={{ borderColor: menuStyles.border.split(' ')[2] }}>
                <p 
                  className="text-xs font-mono text-center"
                  style={{ 
                    color: currentTheme === 'coolRetro' ? '#cc8800' : '#9ca3af',
                    textShadow: currentTheme === 'coolRetro' ? '0 0 2px #ffb000' : 'none'
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