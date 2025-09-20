import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import { useTranslation } from '../../hooks/useTranslation';

export default function ScrollToBottomButton({
    show,
    newMessagesCount = 0,
    onClick,
    theme,
    currentTheme
}) {
    const { t } = useTranslation();
    const getButtonStyles = () => {
        switch (currentTheme) {
            case 'matrix':
                return {
                    bg: 'rgba(0, 255, 0, 0.9)',
                    border: '1px solid #00ff00',
                    color: '#000000',
                    shadow: '0 0 10px #00ff00',
                    hover: 'rgba(0, 200, 0, 0.9)'
                };
            case 'coolRetro':
                return {
                    bg: 'rgba(255, 204, 0, 0.9)',
                    border: '1px solid #ffcc00',
                    color: '#000000',
                    shadow: '0 0 10px #ffcc00',
                    hover: 'rgba(255, 180, 0, 0.9)'
                };
            case 'windows95':
                return {
                    bg: '#c0c0c0',
                    border: '2px outset #c0c0c0',
                    color: '#000000',
                    shadow: '2px 2px 4px rgba(0,0,0,0.5)',
                    hover: '#d0d0d0'
                };
            case 'macOS':
                return {
                    bg: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #d1d5db',
                    color: '#374151',
                    shadow: '0 2px 8px rgba(0,0,0,0.15)',
                    hover: 'rgba(249, 250, 251, 0.95)'
                };
            case 'ubuntu':
                return {
                    bg: 'rgba(233, 84, 32, 0.9)',
                    border: '1px solid #e95420',
                    color: '#ffffff',
                    shadow: '0 2px 8px rgba(233, 84, 32, 0.3)',
                    hover: 'rgba(207, 73, 27, 0.9)'
                };
            default:
                return {
                    bg: 'rgba(59, 130, 246, 0.9)',
                    border: '1px solid #3b82f6',
                    color: '#ffffff',
                    shadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    hover: 'rgba(37, 99, 235, 0.9)'
                };
        }
    };

    const styles = getButtonStyles();

    return (
        <AnimatePresence>
            {show && (
                <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    onClick={onClick}
                    className="fixed bottom-20 right-4 z-30 w-9 h-9 rounded-full flex items-center justify-center hover:scale-105 transition-transform scroll-to-bottom-btn"
                    style={{
                        backgroundColor: styles.bg,
                        border: styles.border,
                        color: styles.color,
                        boxShadow: styles.shadow
                    }}
                    whileHover={{
                        backgroundColor: styles.hover,
                        scale: 1.05
                    }}
                    whileTap={{ scale: 0.95 }}
                    >
                    <FiChevronDown className="w-6 h-6" />

                    {newMessagesCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                            style={{
                                fontSize: '10px',
                                fontWeight: 'bold',
                                fontFamily: 'monospace'
                            }}
                        >
                            {newMessagesCount > 99 ? '99+' : newMessagesCount}
                        </motion.div>
                    )}
                </motion.button>
            )}
        </AnimatePresence>
    );
}