import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiExternalLink } from 'react-icons/fi';
import { FaRegCopy } from "react-icons/fa";

export default function MessageRenderer({ content, currentTheme = 'default' }) {
  const hasMarkdown = /[*_`#>\[\]|]/.test(content) || content.includes('```');
  
  if (!hasMarkdown) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  const getSyntaxTheme = () => {
    switch (currentTheme) {
      case 'matrix':
      case 'coolRetro':
      case 'ubuntu':
      case 'hackingMode':
        return oneDark;
      case 'macOS':
      case 'windows95':
        return oneLight;
      default:
        return oneDark;
    }
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'text';
            
            if (!inline && match) {
              return (
                <div className="my-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs opacity-70 font-mono">
                      {language.toUpperCase()}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(String(children))}
                      className="ml-1 text-xs opacity-70 hover:opacity-100 transition-opacity px-2 py-1 rounded flex items-center gap-1"
                      title="Copy code"
                    >
                      <FaRegCopy className="w-4 h-4" />
                    </button>
                  </div>
                  <SyntaxHighlighter
                    style={getSyntaxTheme()}
                    language={language}
                    PreTag="div"
                    className="rounded-lg overflow-hidden"
                    customStyle={{
                      margin: 0,
                      background: '#111',
                      fontSize: '14px',
                      lineHeight: '1.4'
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              );
            } else {
              return (
                <code
                  className="bg-gray-800 text-green-400 px-1 py-0.5 rounded text-sm font-mono"
                  style={{
                    backgroundColor: currentTheme === 'matrix' ? 'rgba(0, 100, 0, 0.3)' : 'rgba(0, 0, 0, 0.6)',
                    color: currentTheme === 'matrix' ? '#00ff88' : '#22c55e'
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
          },
          
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-2 text-blue-400"># {children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mb-2 text-blue-400">## {children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold mb-1 text-blue-400">### {children}</h3>
          ),
          
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
          ),
          
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
            >
              {children}
              <FiExternalLink className="w-3 h-3" />
            </a>
          ),
          
          strong: ({ children }) => (
            <strong className="font-bold text-yellow-400">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-cyan-400">{children}</em>
          ),
          
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 my-2 italic opacity-80">
              {children}
            </blockquote>
          ),
          
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-gray-600 rounded">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-600 px-3 py-2 bg-gray-800 font-bold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-600 px-3 py-2">
              {children}
            </td>
          ),
          
          p: ({ children }) => (
            <p className="whitespace-pre-wrap mb-2 last:mb-0">{children}</p>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}