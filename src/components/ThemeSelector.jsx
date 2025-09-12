import React, { useState, useRef, useEffect } from 'react';
import { useTerminalTheme } from '../hooks/useTerminalTheme';
import { useTranslation } from '../hooks/useTranslation';
import { FiTerminal, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeSelector() {
  const { theme, currentTheme, changeTheme, getThemesList, allThemes } = useTerminalTheme();
  const { language, changeLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const themes = getThemesList();
  const terminalThemes = allThemes;
  const dropdownRef = useRef(null);

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // close dropdown with escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const handleThemeChange = (themeKey) => {
    changeTheme(themeKey);
    setIsOpen(false);
  };

  const handleLanguageChange = () => {
    const newLang = language === 'es' ? 'en' : 'es';
    changeLanguage(newLang);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Language selector with animations */}
      <button
        onClick={handleLanguageChange}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${theme.colors.input} hover:opacity-80`}
        style={{ 
          color: theme.colors.text,
          fontFamily: theme.font 
        }}
        title={language === 'es' ? 'Switch to English' : 'Cambiar a español'}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={language}
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="text-sm"
          >
            {language === 'es' ? '🇬🇧' : '🇪🇸'}
          </motion.span>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.span
            key={language + '-text'}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-medium hidden sm:inline"
          >
            {language === 'es' ? 'EN' : 'ES'}
          </motion.span>
        </AnimatePresence>
      </button>

      {/* Theme selector with animations */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${theme.colors.input} hover:opacity-80`}
          style={{ 
            color: theme.colors.text,
            fontFamily: theme.font 
          }}
          title="Cambiar tema de terminal"
        >
          <FiTerminal className="w-4 h-4" />
          <AnimatePresence mode="wait">
            <motion.span
              key={currentTheme + '-theme-name'}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-medium hidden sm:inline"
            >
              {theme.name}
            </motion.span>
          </AnimatePresence>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FiChevronDown className="w-3 h-3" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="absolute top-full right-0 sm:left-0 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
              style={{ 
                zIndex: currentTheme === 'coolRetro' ? 52000 : 50,
                backgroundColor: currentTheme === 'coolRetro' ? 'rgba(0, 0, 0, 0.95)' : undefined,
                border: currentTheme === 'coolRetro' ? '1px solid #ffb000' : undefined,
                right: currentTheme === 'coolRetro' ? 0 : 'auto',
                left: currentTheme === 'coolRetro' ? 'auto' : 0,
                transform: currentTheme === 'coolRetro' ? 'translateX(8px)' : 'none' 
              }}
            >
              <div className="p-3">
                
                {/* theme list */}
                <div className="space-y-1">
                  {themes.map((themeOption) => {
                    const isActive = currentTheme === themeOption.key;
                    const themeConfig = terminalThemes[themeOption.key];
                    
                    return (
                      <button
                        key={themeOption.key}
                        onClick={() => handleThemeChange(themeOption.key)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors font-mono flex items-center justify-between group ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                        style={{
                          backgroundColor: isActive && currentTheme === 'coolRetro' 
                            ? 'rgba(255, 176, 0, 0.3)' 
                            : !isActive && currentTheme === 'coolRetro'
                            ? 'transparent'
                            : undefined,
                          color: currentTheme === 'coolRetro' 
                            ? (isActive ? '#ffffff' : '#ffcc00')
                            : undefined,
                          textShadow: currentTheme === 'coolRetro' && !isActive
                            ? '0 0 3px #ffb000' 
                            : undefined
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full border border-gray-500"
                            style={{ 
                              backgroundColor: themeConfig?.colors?.accent || '#3b82f6'
                            }}
                          />
                          <span>{themeOption.name}</span>
                        </div>
                        
                        {isActive && (
                          <span className="text-xs font-bold">●</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer informative */}
                <div className="mt-3 pt-2 border-t border-gray-600">
                  <p 
                    className="text-xs font-mono"
                    style={{ 
                      color: currentTheme === 'coolRetro' ? '#cc8800' : '#9ca3af',
                      textShadow: currentTheme === 'coolRetro' ? '0 0 2px #ffb000' : 'none'
                    }}
                  >
                    // Current: {theme.name}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}