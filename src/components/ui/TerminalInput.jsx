import React, { useState, useRef, useEffect } from 'react';
import TerminalCursor from './TerminalCursor';

export default function TerminalInput({ 
  value, 
  onChange, 
  currentTheme, 
  prompt,
  placeholder = '',
  disabled = false,
  className = ''
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null);
  const measureRef = useRef(null);

  // Update cursor position when value changes
  useEffect(() => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || value.length);
    }
  }, [value]);

  // Handle input changes and update cursor position
  const handleChange = (e) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  // Handle click to update cursor position
  const handleClick = () => {
    setTimeout(() => {
      if (inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart);
      }
    }, 10);
  };

  // Handle key navigation 
  const handleKeyUp = (e) => {
    setCursorPosition(e.target.selectionStart);
  };

  // Calculate visual cursor position based on text width
  const getVisualCursorPosition = () => {
    if (!measureRef.current) return 0;
    
    // Create text up to cursor position
    const textBeforeCursor = value.substring(0, cursorPosition);
    measureRef.current.textContent = textBeforeCursor;
    
    return measureRef.current.offsetWidth;
  };

  // Get prompt styles based on theme
  const getPromptStyles = () => {
    switch (currentTheme) {
      case 'matrix':
        return 'text-green-400 font-mono';
      case 'coolRetro':
        return 'text-cyan-400 font-mono';
      case 'ubuntu':
        return 'text-orange-400 font-mono';
      case 'windows95':
        return 'text-black font-sans text-sm';
      case 'macOS':
        return 'text-blue-400 font-mono';
      default:
        return 'text-gray-400 font-mono';
    }
  };

  // Get input styles based on theme
  const getInputStyles = () => {
    const baseStyles = "bg-transparent outline-none w-full font-mono terminal-input";
    
    switch (currentTheme) {
      case 'matrix':
        return `${baseStyles} text-green-400 caret-transparent`;
      case 'coolRetro':
        return `${baseStyles} text-cyan-400 caret-transparent`;
      case 'ubuntu':
        return `${baseStyles} text-orange-100 caret-transparent`;
      case 'windows95':
        return `${baseStyles} text-black caret-transparent`;
      case 'macOS':
        return `${baseStyles} text-white caret-transparent`;
      default:
        return `${baseStyles} text-white caret-transparent`;
    }
  };

  return (
    <div className={`flex items-center relative terminal-input-container ${className}`}>
      {/* Terminal prompt */}
      {prompt && (
        <span className={`${getPromptStyles()} mr-1 flex-shrink-0`}>
          {prompt}
        </span>
      )}
      
      {/* Input container with custom cursor */}
      <div className="flex-1 relative">
        {/* Invisible element to measure text width */}
        <span 
          ref={measureRef}
          className={`absolute invisible whitespace-pre cursor-position-measure ${getInputStyles()}`}
          style={{ 
            fontSize: 'inherit',
            fontFamily: 'inherit',
            letterSpacing: 'inherit'
          }}
        />
        
        {/* Actual input field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onClick={handleClick}
          onKeyUp={handleKeyUp}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? '' : placeholder}
          disabled={disabled}
          className={getInputStyles()}
          autoComplete="off"
          spellCheck="false"
        />
        
        {/* Custom terminal cursor */}
        {isFocused && (
          <div 
            className="absolute top-0 pointer-events-none"
            style={{ 
              left: `${getVisualCursorPosition()}px`,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              zIndex: 10
            }}
          >
            <TerminalCursor currentTheme={currentTheme} visible={true} />
          </div>
        )}
      </div>
    </div>
  );
}
