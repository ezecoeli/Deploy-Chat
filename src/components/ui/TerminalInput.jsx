import React, { useState, useRef, useEffect, useCallback } from 'react';
import TerminalCursor from './TerminalCursor';

export default function TerminalInput({ 
  value = '', 
  onChange, 
  currentTheme, 
  prompt,
  placeholder = '',
  disabled = false,
  className = ''
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [visualCursorPosition, setVisualCursorPosition] = useState(0);
  const inputRef = useRef(null);
  const measureRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate cursor position without complex scrolling
  const updateCursorDisplay = useCallback(() => {
    if (!measureRef.current || !containerRef.current) return;
    
    const textBeforeCursor = value.substring(0, cursorPosition);
    measureRef.current.textContent = textBeforeCursor || '';
    
    const textWidth = measureRef.current.offsetWidth;
    setVisualCursorPosition(textWidth);
  }, [value, cursorPosition]);

  // Update cursor position when value changes
  useEffect(() => {
    if (inputRef.current) {
      const newPosition = inputRef.current.selectionStart || value.length;
      setCursorPosition(newPosition);
    }
  }, [value]);

  // Update visual cursor position
  useEffect(() => {
    updateCursorDisplay();
  }, [updateCursorDisplay]);

  // Handle input changes
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCursorPosition(e.target.selectionStart);
  };

  // Handle cursor position updates
  const handleSelectionChange = useCallback(() => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart);
    }
  }, []);

  // Auto-scroll input to keep cursor visible
  useEffect(() => {
    if (inputRef.current && isFocused) {
      const input = inputRef.current;
      const cursorPixelPosition = visualCursorPosition;
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const scrollLeft = input.scrollLeft;
      const visibleStart = scrollLeft;
      const visibleEnd = scrollLeft + containerWidth - 60; // Reserve space for cursor

      // Scroll if cursor is outside visible area
      if (cursorPixelPosition < visibleStart) {
        input.scrollLeft = Math.max(0, cursorPixelPosition - 20);
      } else if (cursorPixelPosition > visibleEnd) {
        input.scrollLeft = cursorPixelPosition - containerWidth + 60;
      }
    }
  }, [visualCursorPosition, isFocused]);

  // Get styles based on theme
  const getPromptStyles = () => {
    switch (currentTheme) {
      case 'matrix': return 'text-green-400 font-mono';
      case 'coolRetro': return 'text-cyan-400 font-mono';
      case 'ubuntu': return 'text-orange-400 font-mono';
      case 'windows95': return 'text-black font-sans text-sm';
      case 'macOS': return 'text-blue-400 font-mono';
      default: return 'text-gray-400 font-mono';
    }
  };

  const getInputStyles = () => {
    const baseStyles = "bg-transparent outline-none w-full font-mono";
    
    switch (currentTheme) {
      case 'matrix': return `${baseStyles} text-green-400`;
      case 'coolRetro': return `${baseStyles} text-cyan-400`;
      case 'ubuntu': return `${baseStyles} text-orange-100`;
      case 'windows95': return `${baseStyles} text-black`;
      case 'macOS': return `${baseStyles} text-white`;
      default: return `${baseStyles} text-white`;
    }
  };

  const getPlaceholderStyles = () => {
    switch (currentTheme) {
      case 'matrix': return 'text-green-600';
      case 'coolRetro': return 'text-cyan-600';
      case 'ubuntu': return 'text-orange-600';
      case 'windows95': return 'text-gray-200';
      case 'macOS': return 'text-gray-100';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`flex items-center relative ${className}`}>
      {/* Terminal prompt */}
      {prompt && (
        <span className={`${getPromptStyles()} mr-2 flex-shrink-0 select-none`}>
          {prompt}
        </span>
      )}
      
      {/* Input container */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {/* Invisible element for text measurement */}
        <span 
          ref={measureRef}
          className="absolute invisible whitespace-pre font-mono pointer-events-none"
          style={{ 
            fontSize: 'inherit',
            fontFamily: 'inherit',
            letterSpacing: 'inherit',
            top: 0,
            left: 0,
            zIndex: -1
          }}
        />
        
        {/* Placeholder (only when not focused and no value) */}
        {!isFocused && !value && placeholder && (
          <div 
            className={`absolute top-0 left-0 pointer-events-none whitespace-nowrap overflow-hidden font-mono ${getPlaceholderStyles()}`}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {placeholder}
          </div>
        )}
        
        {/* Actual input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyUp={handleSelectionChange}
          onClick={handleSelectionChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={`${getInputStyles()} caret-transparent`}
          autoComplete="off"
          spellCheck="false"
          style={{
            width: '100%',
            paddingRight: '30px',
            overflow: 'hidden',
            textOverflow: 'clip'
          }}
        />
        
        {/* Custom cursor */}
        {isFocused && (
          <div 
            className="absolute top-0 bottom-0 pointer-events-none flex items-center"
            style={{ 
              left: `${Math.min(visualCursorPosition, (containerRef.current?.offsetWidth || 0) - 30)}px`,
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