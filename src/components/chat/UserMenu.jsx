import React, { useState, useRef, useEffect } from 'react';
import { getAvatarById } from '../../config/avatars';
import { FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

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
  const userMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
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

  // Close dropdowns with the Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
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

  // Function to get the visual connection status
  const getStatusInfo = () => {
    return {
      color: 'bg-green-500',
      text: t('online') || 'En línea',
      textColor: 'text-green-400'
    };
  };

  const handleProfileClick = () => {
    onOpenProfile?.();
    setShowUserMenu(false);
  };

  const handleLogoutClick = () => {
    onLogout?.();
    setShowUserMenu(false);
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="relative" ref={userMenuRef}>
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${theme.colors.input} hover:opacity-80`}
        style={{ 
          color: theme.colors.text,
          fontFamily: theme.font 
        }}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center flex-shrink-0">
          {renderAvatar(userProfile?.avatar_url || 'avatar-01', userProfile?.username || user?.email)}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium">
            {userProfile?.username || user?.email?.split('@')[0]}
          </p>
          <p className="text-xs opacity-70">
            {statusInfo.text}
          </p>
        </div>
        <FiChevronDown className={`w-3 h-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
      </button>

      {showUserMenu && (
        <AnimatePresence>
          <motion.div
            className="absolute right-0 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ zIndex: 50 }}
          >
            <div className="p-3">
              {/* Header */}
              <div className="mb-3 pb-2 border-b border-gray-600">
                <p 
                  className="text-xs font-mono text-center"
                  style={{ 
                    color: currentTheme === 'coolRetro' ? '#cc8800' : '#9ca3af',
                    textShadow: currentTheme === 'coolRetro' ? '0 0 2px #ffb000' : 'none'
                  }}
                >
                  // user_menu
                </p>
              </div>

              {/* Menu options */}
              <div className="space-y-1">
                <button
                  onClick={handleProfileClick}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors hover:bg-gray-700 flex items-center gap-2 ${
                    currentTheme === 'coolRetro' ? 'crt-menu-item' : ''
                  }`}
                  style={{ 
                    color: currentTheme === 'coolRetro' ? '#ffcc00' : '#d1d5db',
                    textShadow: currentTheme === 'coolRetro' ? '0 0 3px #ffb000' : 'none',
                    backgroundColor: 'transparent'
                  }}
                >
                  <FiUser className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{t('editProfile') || 'Editar perfil'}</span>
                </button>
                
                <hr 
                  className="my-2"
                  style={{ 
                    borderColor: currentTheme === 'coolRetro' ? '#664400' : '#4b5563'
                  }}
                />
                
                <button
                  onClick={handleLogoutClick}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors hover:bg-red-900/20 flex items-center gap-2 ${
                    currentTheme === 'coolRetro' ? 'crt-menu-item-danger' : ''
                  }`}
                  style={{ 
                    color: currentTheme === 'coolRetro' ? '#ff9999' : '#ef4444',
                    textShadow: currentTheme === 'coolRetro' ? '0 0 3px #ff6666' : 'none',
                    backgroundColor: 'transparent'
                  }}
                >
                  <FiLogOut className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{t('logout') || 'Cerrar sesión'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}