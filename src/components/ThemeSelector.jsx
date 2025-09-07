import React, { useState } from 'react';
import { useTerminalTheme } from '../hooks/useTerminalTheme';
import { FiTerminal, FiChevronDown } from 'react-icons/fi';

export default function ThemeSelector() {
  const { theme, currentTheme, changeTheme, getThemesList, allThemes } = useTerminalTheme();
  const [isOpen, setIsOpen] = useState(false);
  const themes = getThemesList();
  const terminalThemes = allThemes;

  const handleThemeChange = (themeKey) => {
    changeTheme(themeKey);
    setIsOpen(false);
  };

  return (
    <div className="relative">
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
        <span className="text-sm font-medium">DevShell</span>
        <FiChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="absolute top-full right-0 sm:left-0 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
            <div className="p-3">
              {/* Header del dropdown */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-600">
                <FiTerminal className="w-4 h-4 text-blue-400" />
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
                    >
                      <div className="flex items-center gap-3">
                        {/* Indicador visual del tema */}
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-500"
                          style={{ 
                            backgroundColor: themeConfig?.colors?.accent || '#3b82f6'
                          }}
                        />
                        <span>{themeOption.name}</span>
                      </div>
                      
                      {/* Indicador de tema activo */}
                      {isActive && (
                        <span className="text-xs font-bold">●</span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Footer informativo */}
              <div className="mt-3 pt-2 border-t border-gray-600">
                <p className="text-xs text-gray-400 font-mono">
                  // Current: {theme.name}
                </p>
              </div>
            </div>
          </div>
          
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
}