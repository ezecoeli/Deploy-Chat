import React from 'react';
import CodeBlock from './CodeBlock';
import { parseMessage } from '../../utils/messageParser';

export default function MessageRenderer({ content }) {
  const parts = parseMessage(content);

  return (
    <>
      {parts.map((part, idx) =>
        part.type === 'code'
          ? <CodeBlock key={idx} code={part.content} language={part.language} />
          : <span key={idx} className="whitespace-pre-wrap">{part.content}</span>
      )}
    </>
  );
}