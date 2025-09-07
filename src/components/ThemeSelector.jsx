import React, { useState, useRef, useEffect } from 'react';
import { useTerminalTheme } from '../hooks/useTerminalTheme';
import { useTranslation } from '../hooks/useTranslation';
import { FiTerminal, FiChevronDown } from 'react-icons/fi';

export default function ThemeSelector() {
  const { theme, currentTheme, changeTheme, getThemesList, allThemes } = useTerminalTheme();
  const { language, changeLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const themes = getThemesList();
  const terminalThemes = allThemes;
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
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

  // Cerrar dropdown con la tecla Escape
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
      {/* Selector de idioma  */}
      <button
        onClick={handleLanguageChange}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${theme.colors.input} hover:opacity-80`}
        style={{ 
          color: theme.colors.text,
          fontFamily: theme.font 
        }}
        title={language === 'es' ? 'Switch to English' : 'Cambiar a español'}
      >
        <span className="text-sm">
          {language === 'es' ? '🇬🇧' : '🇪🇸'}
        </span>
        <span className="text-sm font-medium hidden sm:inline">
          {language === 'es' ? 'EN' : 'ES'}
        </span>
      </button>

      {/* Selector de temas */}
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
          <span className="text-sm font-medium hidden sm:inline">DevShell</span>
          <FiChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div 
            className="absolute top-full right-0 sm:left-0 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
            style={{ 
              zIndex: currentTheme === 'coolRetro' ? 51000 : 50,
              backgroundColor: currentTheme === 'coolRetro' ? 'rgba(0, 0, 0, 0.95)' : undefined,
              border: currentTheme === 'coolRetro' ? '1px solid #ffb000' : undefined
            }}
          >
            <div className="p-3">
              {/* Header del dropdown */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-600">
                <FiTerminal className="w-4 h-4 text-blue-400" />
                <span 
                  className="text-sm font-medium font-mono"
                  style={{ 
                    color: currentTheme === 'coolRetro' ? '#ffcc00' : '#ffffff',
                    textShadow: currentTheme === 'coolRetro' ? '0 0 3px #ffb000' : 'none'
                  }}
                >
                  Terminal Themes
                </span>
              </div>
              
              {/* Lista de temas */}
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
              
              {/* Footer informativo */}
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
          </div>
        )}
      </div>
    </div>
  );
}