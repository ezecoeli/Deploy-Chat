import { useState, useEffect } from 'react';

const terminalThemes = {
  default: {
    name: 'Deploy Classic',
    prompt: '$',
    font: '"Inter", "SF Pro Display", system-ui, sans-serif',
    colors: {
      bg: 'from-slate-900 via-gray-900 to-slate-800',
      primary: '#ffffff',
      secondary: '#64748b',
      text: '#ffffff',
      textSecondary: '#94a3b8',
      accent: '#3b82f6',
      border: '#475569',
      input: 'bg-gray-700 border-gray-600',
      button: 'bg-violet-600 hover:bg-violet-800 text-white',
      message: 'bg-gray-800',
      statusOnline: '#22c55e'
    },
    effects: {
      textShadow: 'none',
      glow: 'shadow-blue-500/20'
    }
  },

  matrix: {
    name: 'Matrix Terminal',
    prompt: '$',
    font: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    colors: {
      bg: 'from-black via-gray-900 to-green-900',
      primary: '#00ff00',
      secondary: '#39ff14', 
      text: '#00ff00',
      textSecondary: '#008000',
      accent: '#39ff14',
      border: '#004400',
      input: 'bg-black border-green-500',
      button: 'bg-green-900 hover:bg-green-800 text-green-100',
      message: 'bg-gray-900 border-l-4 border-l-green-500',
      statusOnline: '#22c55e'
    },
    effects: {
      textShadow: '0 0 10px #00ff00',
      glow: 'shadow-green-500/50'
    }
  },
  
  ubuntu: {
    name: 'Ubuntu Terminal',
    prompt: '~$',
    font: '"Ubuntu Mono", "Liberation Mono", "Consolas", monospace',
    colors: {
      bg: 'from-purple-900 via-gray-900 to-orange-900',
      primary: '#ffffff',
      secondary: '#e95420',
      text: '#ffffff',
      textSecondary: '#cccccc',
      accent: '#e95420',
      border: '#772953',
      input: 'bg-gray-800 border-orange-500',
      button: 'bg-orange-600 hover:bg-orange-700 text-white',
      message: 'bg-gray-800 border-l-4 border-l-orange-500',
      statusOnline: '#22c55e'
    },
    effects: {
      textShadow: 'none',
      glow: 'shadow-orange-500/30'
    }
  },

  macOS: {
    name: 'macOS Terminal',
    prompt: '%',
    font: '"SF Mono", "Monaco", "Menlo", monospace',
    colors: {
      bg: 'from-gray-900 via-slate-800 to-blue-900',
      primary: '#ffffff',
      secondary: '#007aff',
      text: '#ffffff',
      textSecondary: '#a1a1aa',
      accent: '#007aff',
      border: '#374151',
      input: 'bg-slate-800 border-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      message: 'bg-slate-800 border-l-4 border-l-blue-500',
      statusOnline: '#22c55e'
    },
    effects: {
      textShadow: 'none',
      glow: 'shadow-blue-500/30'
    }
  },

  retro: {
    name: 'Retro DOS',
    prompt: 'C:\\>',
    font: '"Courier New", "Courier", monospace',
    colors: {
      bg: 'from-amber-900 via-yellow-800 to-orange-900',
      primary: '#ffd700',
      secondary: '#ff8c00',
      text: '#ffd700',
      textSecondary: '#ffaa00',
      accent: '#ff8c00',
      border: '#b8860b',
      input: 'bg-black border-yellow-500',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-black',
      message: 'bg-yellow-900 border-l-4 border-l-yellow-500',
      statusOnline: '#22c55e'
    },
    effects: {
      textShadow: '0 0 5px #ffd700',
      glow: 'shadow-yellow-500/50'
    }
  }
};

const themeChangeEvent = new EventTarget();

export const useTerminalTheme = () => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('terminal-theme');
    //  Por defecto 'default'
    return saved && terminalThemes[saved] ? saved : 'default';
  });

  // Escuchar cambios de tema desde otras instancias
  useEffect(() => {
    const handleThemeChange = (event) => {
      const newTheme = event.detail.theme;
      setCurrentTheme(newTheme);
    };

    themeChangeEvent.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      themeChangeEvent.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('terminal-theme', currentTheme);
  }, [currentTheme]);

  const theme = terminalThemes[currentTheme];
  
  const changeTheme = (themeName) => {
    if (terminalThemes[themeName]) {
      setCurrentTheme(themeName);
      
      // Emitir evento para notificar a otras instancias
      themeChangeEvent.dispatchEvent(
        new CustomEvent('themeChanged', { 
          detail: { theme: themeName } 
        })
      );
      
      return true;
    }
    return false;
  };

  const getThemesList = () => {
    return Object.keys(terminalThemes).map(key => ({
      key,
      name: terminalThemes[key].name
    }));
  };

  return {
    theme,
    currentTheme,
    changeTheme,
    getThemesList,
    allThemes: terminalThemes
  };
};