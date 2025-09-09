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
        prompt: 'Neo>',
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
            button: 'bg-black hover:bg-[#001100] text-[#00ff00] border-2 border-[#00ff00] shadow-[0_0_10px_#00ff00] font-mono font-bold hover:shadow-[0_0_20px_#00ff00] transition-all duration-300',
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
            bg: 'from-[#300a24] via-[#2c0e1f] to-[#1a0510]',
            primary: '#ffffff',
            secondary: '#e95420',
            text: '#ffffff',
            textSecondary: '#d3d3d3',
            accent: '#e95420',
            border: '#772953',
            input: 'bg-[#300a24] border-orange-500',
            button: 'bg-orange-600 hover:bg-orange-700 text-white font-bold',
            message: 'bg-[#300a24] border-l-4 border-l-orange-500',
            statusOnline: '#22c55e',
            directory: '#5555ff',
            command: '#55ff55', 
            username: '#e95420', 
            hostname: '#ffffff' 
        },
        effects: {
            textShadow: 'none',
            glow: 'shadow-orange-500/30',
            ubuntuMode: true
        }
    },

    macOS: {
        name: 'macOS',
        prompt: '%',
        font: '"Monaco", "Menlo", "SF Mono", monospace',
        colors: {
            bg: 'from-black via-[#1a1a2e] to-[#16213e]',
            primary: '#ffffff',
            secondary: '#ff6b6b',
            text: '#ffffff',
            textSecondary: '#a8a8a8',
            accent: '#4ecdc4',
            border: '#ff6b6b',
            input: 'bg-[#1a1a2e] border-[#4ecdc4]',
            button: 'bg-gradient-to-r from-[#ff6b6b] via-[#4ecdc4] to-[#45b7d1] hover:from-[#ff5252] hover:via-[#26d0ce] hover:to-[#1e88e5] text-white font-bold',
            message: 'bg-[#1a1a2e] border-l-4 border-l-[#4ecdc4]',
            statusOnline: '#4ecdc4',
            // rainbow colors
            rainbow1: '#5EBD3E',
            rainbow2: '#FFB900',
            rainbow3: '#F78200',
            rainbow4: '#E23838',
            rainbow5: '#973999',
            rainbow6: '#009CDF'
        },
        effects: {
            textShadow: '0 0 8px rgba(78, 205, 196, 0.6)',
            glow: 'shadow-cyan-400/30',
            rainbow: true,
            retroMac: true
        }
    },

    windows95: {
        name: 'Windows 95',
        prompt: 'C:\>',
        font: '"Perfect DOS VGA 437", "Courier New", "Lucida Console", monospace',
        colors: {
            bg: 'from-black to-black',
            primary: '#ffffff',
            secondary: '#ffffff',
            text: '#ffffff',
            textSecondary: '#c0c7c8',
            accent: '#ffffff',
            border: '#c0c7c8',
            input: 'bg-black border-[#c0c7c8] border-1',
            button: 'bg-gradient-to-b from-[#e5e7eb] to-[#9ca3af] hover:from-[#f3f4f6] hover:to-[#d1d5db] text-black border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#6b7280] border-b-[#6b7280] shadow-lg font-bold active:from-[#9ca3af] active:to-[#6b7280]',
            message: 'bg-black border-l-2 border-l-[#c0c7c8]',
            statusOnline: '#00ff00',
            headerBg: '#000080',
            headerText: '#ffffff'
        },
        effects: {
            textShadow: 'none',
            glow: 'none',
            pixelated: true,
            dosMode: true,
            dosHeader: true  
        }
    },

    coolRetro: {
        name: 'Amber CRT',
        prompt: 'C>',
        font: '"Courier New", "Monaco", "Lucida Console", monospace',
        colors: {
            bg: 'from-black to-black',
            primary: '#ffcc00',
            secondary: '#ff8c00',
            text: '#ffcc00',
            textSecondary: '#ffaa00',
            accent: '#ffcc00',
            border: '#ffb000',
            input: 'bg-black border-amber-500',
            button: 'bg-amber-600 hover:bg-amber-500 text-black font-bold',
            message: 'bg-black border-l-2 border-l-amber-500',
            statusOnline: '#22c55e'
        },
        effects: {
            textShadow: '0 0 6px #ffb000, 0 0 12px rgba(255, 176, 0, 0.5)',
            glow: 'shadow-amber-500/50',
            scanLines: true,
            curvature: false,
            phosphor: true
        }
    },
};

const themeChangeEvent = new EventTarget();

export const useTerminalTheme = () => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        const saved = localStorage.getItem('terminal-theme');
        //  'default'
        return saved && terminalThemes[saved] ? saved : 'default';
    });

    // Listen for theme changes from other instances
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

            // Emit event to notify other instances
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

    useEffect(() => {
        // Apply theme to body automatically
        document.body.setAttribute('data-theme', currentTheme);

        // Apply special effects for coolRetro
        if (currentTheme === 'coolRetro') {
            document.body.classList.add('cool-retro-active');
        } else {
            document.body.classList.remove('cool-retro-active');
        }

        return () => {
            document.body.removeAttribute('data-theme');
            document.body.classList.remove('cool-retro-active');
        };
    }, [currentTheme]);

    return {
        theme,
        currentTheme,
        changeTheme,
        getThemesList,
        allThemes: terminalThemes
    };
};