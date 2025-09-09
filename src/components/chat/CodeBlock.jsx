import React, { useState, useEffect } from 'react';

export default function CodeBlock({ code, language = 'js' }) {
  const [currentTheme, setCurrentTheme] = useState('');

  // Monitor theme changes
  useEffect(() => {
    const updateTheme = () => {
      const body = document.body;
      const theme = body.getAttribute('data-theme');
      setCurrentTheme(theme || 'default');
    };

    updateTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateTheme();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Auto-format code for better readability
  const formatCode = (code, language) => {
    try {
      switch (language) {
        case 'json':
          // Auto-format JSON with proper indentation
          const parsed = JSON.parse(code);
          return JSON.stringify(parsed, null, 2);
        
        case 'js':
        case 'javascript':
          // Basic JS formatting - only if it's minified (no line breaks)
          if (!code.includes('\n') && code.length > 50) {
            return code
              .replace(/;([^\/])/g, ';\n$1')
              .replace(/\{([^}])/g, '{\n  $1')
              .replace(/([^{])\}/g, '$1\n}')
              .replace(/,([^\/\s])/g, ',\n  $1');
          }
          return code;
        
        default:
          return code;
      }
    } catch (error) {
      // If formatting fails, return original code
      return code;
    }
  };

  // Get scrollbar class based on current theme
  const getScrollbarClass = () => {
    switch (currentTheme) {
      case 'matrix':
        return 'matrix-scrollbar';
      case 'windows95':
        return 'windows95-scrollbar';
      case 'ubuntu':
        return 'ubuntu-scrollbar';
      case 'macOS':
        return 'mac-scrollbar';
      case 'coolRetro':
        return 'coolretro-scrollbar';
      case 'hackingMode':
        return 'hackingmode-scrollbar';
      case 'default':
        return 'default-scrollbar';
      default:
        return 'custom-scrollbar';
    }
  };

  // Format code first, then apply syntax highlighting
  const formattedCode = formatCode(code, language);
  let highlighted = formattedCode;

  // Apply syntax highlighting based on language
  if (language === 'js' || language === 'javascript') {
    highlighted = formattedCode
      .replace(/\b(function|const|let|var|if|else|for|while|return|class|import|export|from|async|await)\b/g, '<span style="color:#3b82f6">$1</span>')
      .replace(/(["'`].*?["'`])/g, '<span style="color:#22c55e">$1</span>')
      .replace(/(\/\/.*)/g, '<span style="color:#64748b">$1</span>');
  } else if (language === 'python' || language === 'py') {
    highlighted = formattedCode
      .replace(/\b(def|class|import|from|as|if|elif|else|for|while|return|try|except|with|lambda|pass|break|continue|True|False|None)\b/g, '<span style="color:#3b82f6">$1</span>')
      .replace(/(['"].*?['"])/g, '<span style="color:#22c55e">$1</span>')
      .replace(/(#.*)/g, '<span style="color:#64748b">$1</span>');
  } else if (language === 'json') {
    highlighted = formattedCode
      .replace(/("[^"]*")(\s*:)/g, '<span style="color:#3b82f6">$1</span>$2')
      .replace(/(:\s*)("[^"]*"|\d+|true|false|null)/g, '$1<span style="color:#22c55e">$2</span>')
      .replace(/(\[|\]|\{|\})/g, '<span style="color:#f59e0b">$1</span>');
  } else if (language === 'java') {
    highlighted = formattedCode
      .replace(/\b(public|private|protected|class|static|void|int|double|float|boolean|char|new|return|if|else|for|while|try|catch|finally|import|package)\b/g, '<span style="color:#3b82f6">$1</span>')
      .replace(/(["'].*?["'])/g, '<span style="color:#22c55e">$1</span>')
      .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span style="color:#64748b">$1</span>');
  } else if (language === 'c') {
    highlighted = formattedCode
      .replace(/\b(int|float|double|char|void|if|else|for|while|return|struct|typedef|include|define)\b/g, '<span style="color:#3b82f6">$1</span>')
      .replace(/(["'].*?["'])/g, '<span style="color:#22c55e">$1</span>')
      .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span style="color:#64748b">$1</span>');
  } else if (language === 'cpp' || language === 'c++') {
    highlighted = formattedCode
      .replace(/\b(int|float|double|char|void|if|else|for|while|return|struct|typedef|include|define|class|public|private|protected|namespace|using|std)\b/g, '<span style="color:#3b82f6">$1</span>')
      .replace(/(["'].*?["'])/g, '<span style="color:#22c55e">$1</span>')
      .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span style="color:#64748b">$1</span>');
  } else if (language === 'sql') {
    highlighted = formattedCode
      .replace(/\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|JOIN|ON|AS|AND|OR|NOT|NULL|PRIMARY|KEY|FOREIGN)\b/gi, '<span style="color:#3b82f6">$1</span>')
      .replace(/('[^']*')/g, '<span style="color:#22c55e">$1</span>')
      .replace(/(--.*)/g, '<span style="color:#64748b">$1</span>');
  } else if (language === 'md' || language === 'markdown') {
    highlighted = formattedCode
      .replace(/^# (.*)$/gm, '<span style="color:#3b82f6;font-weight:bold;font-size:1.2em;"># $1</span>')
      .replace(/^## (.*)$/gm, '<span style="color:#3b82f6;font-weight:bold;">## $1</span>')
      .replace(/\*\*(.*?)\*\*/g, '<span style="font-weight:bold;">$1</span>')
      .replace(/\*(.*?)\*/g, '<span style="font-style:italic;">$1</span>')
      .replace(/`([^`]+)`/g, '<span style="color:#22c55e;background:#222;padding:2px 4px;border-radius:4px;">$1</span>');
  }

  return (
    <div className="my-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-mono">
          📄 {language.toUpperCase()} {formattedCode !== code && '(auto-formatted)'}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(formattedCode)}
          className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded"
          title="Copy code"
        >
          📋 Copy
        </button>
      </div>
      <pre 
        className={`bg-gray-900 rounded-lg p-3 sm:p-4 font-mono text-sm overflow-auto max-h-80 ${getScrollbarClass()}`}
        style={{ 
          background: '#111', 
          color: '#fff', 
          fontFamily: 'Monaco, Menlo, SF Mono, Consolas, monospace',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          lineHeight: '1.4'
        }}
      >
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}