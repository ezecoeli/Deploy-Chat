import React, { useState, useEffect } from 'react';

export default function TerminalCursor({ currentTheme, visible = true }) {
  const [show, setShow] = useState(true);

  // Handle cursor blinking with authentic terminal timing
  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }

    // Authentic terminal cursor speed (530ms)
    const interval = setInterval(() => {
      setShow(prev => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [visible]);

  // Get cursor styles based on current theme
  const getCursorStyles = () => {
    const baseStyles = "inline-block transition-opacity duration-75";
    
    switch (currentTheme) {
      case 'matrix':
        return {
          className: `${baseStyles} bg-green-400`,
          style: {
            width: '8px',
            height: '20px',
            boxShadow: show ? '0 0 5px #00ff00, 0 0 10px #00ff00' : 'none',
            filter: show ? 'brightness(1.2)' : 'brightness(0.8)'
          }
        };
      
      case 'coolRetro':
        return {
          className: `${baseStyles} bg-cyan-400`,
          style: {
            width: '8px',
            height: '20px',
            boxShadow: show ? '0 0 8px #00ffff, 0 0 15px #00ffff, 0 0 25px #00ffff' : 'none',
            filter: show ? 'brightness(1.3) contrast(1.2)' : 'brightness(0.7)'
          }
        };
      
      case 'windows95':
        return {
          className: `${baseStyles} bg-black`,
          style: {
            width: '8px',
            height: '16px',
            boxShadow: 'none',
            border: show ? '1px solid #000000' : '1px solid transparent'
          }
        };
      
      case 'ubuntu':
        return {
          className: `${baseStyles} bg-orange-400`,
          style: {
            width: '2px',
            height: '20px',
            boxShadow: show ? '0 0 3px #ff6600' : 'none'
          }
        };
      
      case 'macOS':
        return {
          className: `${baseStyles} bg-blue-400`,
          style: {
            width: '2px',
            height: '18px',
            borderRadius: '1px',
            boxShadow: show ? '0 0 4px #007AFF' : 'none'
          }
        };
      
      default:
        return {
          className: `${baseStyles} bg-white`,
          style: {
            width: '2px',
            height: '20px',
            boxShadow: show ? '0 0 2px rgba(255,255,255,0.8)' : 'none'
          }
        };
    }
  };

  const cursorStyles = getCursorStyles();

  return (
    <span 
      className={cursorStyles.className}
      style={{
        ...cursorStyles.style,
        opacity: show ? 1 : 0,
        marginLeft: '1px',
        verticalAlign: 'text-bottom'
      }}
    >
      
    </span>
  );
}
