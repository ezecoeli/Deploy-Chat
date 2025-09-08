import React from 'react';

export default function CodeBlock({ code, language = 'js' }) {
  let highlighted = code;

  if (language === 'js' || language === 'javascript') {
    highlighted = code
      .replace(/\b(function|const|let|var|if|else|for|while|return|class|import|export|from|async|await)\b/g, '<span style="color:#3b82f6">$1</span>')
      .replace(/(["'`].*?["'`])/g, '<span style="color:#22c55e">$1</span>')
      .replace(/(\/\/.*)/g, '<span style="color:#64748b">$1</span>');
  } else if (language === 'python' || language === 'py') {
    highlighted = code
      .replace(/\b(def|class|import|from|as|if|elif|else|for|while|return|try|except|with|lambda|pass|break|continue|True|False|None)\b/g, '<span style="color:#3b82f6">$1</span>')
      .replace(/(['"].*?['"])/g, '<span style="color:#22c55e">$1</span>')
      .replace(/(#.*)/g, '<span style="color:#64748b">$1</span>');
  } else if (language === 'json') {
    highlighted = code
      .replace(/("[^"]*")(\s*:)/g, '<span style="color:#3b82f6">$1</span>$2')
      .replace(/(:\s*)("[^"]*"|\d+|true|false|null)/g, '$1<span style="color:#22c55e">$2</span>');
  } else if (language === 'java') {
    highlighted = code
      .replace(/\b(public|private|protected|class|static|void|int|double|float|boolean|char|new|return|if|else|for|while|try|catch|finally|import|package)\b/g, '<span style="color:#3b82f6">$1</span>')
      .replace(/(["'].*?["'])/g, '<span style="color:#22c55e">$1</span>')
      .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span style="color:#64748b">$1</span>');
  } else if (language === 'c') {
    highlighted = code
      .replace(/\b(int|float|double|char|void|if|else|for|while|return|struct|typedef|include|define)\b/g, '<span style="color:#3b82f6">$1</span>')
      .replace(/(["'].*?["'])/g, '<span style="color:#22c55e">$1</span>')
      .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span style="color:#64748b">$1</span>');
  } else if (language === 'cpp' || language === 'c++') {
    highlighted = code
      .replace(/\b(int|float|double|char|void|if|else|for|while|return|struct|typedef|include|define|class|public|private|protected|namespace|using|std)\b/g, '<span style="color:#3b82f6">$1</span>')
      .replace(/(["'].*?["'])/g, '<span style="color:#22c55e">$1</span>')
      .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span style="color:#64748b">$1</span>');
  } else if (language === 'sql') {
    highlighted = code
      .replace(/\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|JOIN|ON|AS|AND|OR|NOT|NULL|PRIMARY|KEY|FOREIGN)\b/gi, '<span style="color:#3b82f6">$1</span>')
      .replace(/('[^']*')/g, '<span style="color:#22c55e">$1</span>')
      .replace(/(--.*)/g, '<span style="color:#64748b">$1</span>');
  } else if (language === 'md' || language === 'markdown') {
    highlighted = code
      .replace(/^# (.*)$/gm, '<span style="color:#3b82f6;font-weight:bold;font-size:1.2em;"># $1</span>')
      .replace(/^## (.*)$/gm, '<span style="color:#3b82f6;font-weight:bold;">## $1</span>')
      .replace(/\*\*(.*?)\*\*/g, '<span style="font-weight:bold;">$1</span>')
      .replace(/\*(.*?)\*/g, '<span style="font-style:italic;">$1</span>')
      .replace(/`([^`]+)`/g, '<span style="color:#22c55e;background:#222;padding:2px 4px;border-radius:4px;">$1</span>');
  }

  return (
    <pre style={{ background: '#111', color: '#fff', padding: '1em', borderRadius: '8px', fontFamily: 'monospace', overflowX: 'auto' }}>
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
}