import React, { useState, useRef } from 'react';
import { useChatAI } from '../../hooks/useChatAI';
import { useTranslation } from '../../hooks/useTranslation';
import { BsArrowUpCircle } from "react-icons/bs";
import { TbRobot } from "react-icons/tb";

export default function ChatAI({ user, conversationId, theme, currentTheme }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const { loading, error, response, askAI } = useChatAI(user);
  const { t } = useTranslation();

  const handleAsk = () => {
    if (input.trim().length > 0) {
      askAI(input.trim(), conversationId || 'general');
      setInput('');
      // keep focus on input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const colors = theme?.colors || {};

  return (
    <div
      className="p-3 mt-4 border-t rounded"
      style={{
        borderColor: colors.border || '#374151',
        background: colors.message || 'rgba(0,0,0,0.3)',
        color: colors.text || '#fff',
      }}
    >
      <h4
        className="text-2xl font-bold mb-2"
        style={{ color: colors.accent || '#60a5fa' }}
      >
        {t('hello')} <TbRobot className="inline-block w-6 h-6 mb-1" />
      </h4>
      <div className="flex gap-1 mb-2">
        <input
        ref={inputRef}
          aria-label="Pregunta a la IA"
          className="flex-1 px-1 py-1 rounded text-xs border focus:outline-none"
          style={{
            background: colors.inputBg || '#1f2937',
            borderColor: colors.border || '#374151',
            color: colors.inputText || colors.text || '#fff',
            fontSize: '0.875rem',
          }}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('placeholderAI')}
          //disabled={loading}
          // placing colors
          onFocus={e => {
            e.target.style.setProperty('color', colors.inputText || colors.text || '#fff');
            e.target.style.setProperty('background', colors.inputBg || '#1f2937');
            e.target.style.setProperty('caretColor', colors.inputText || colors.text || '#fff');
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !loading) {
              handleAsk();
            }
          }}
        />
        <button
          aria-label="Enviar pregunta a IA"
          className={`px-1 py-1 rounded text-xs font-bold transition flex items-center justify-center group ${colors.button}`}
          style={{
            background: colors.button || colors.accent || '#2563eb',
            color: colors.primary || '#fff',
            borderColor: colors.border || '#374151',
          }}
          onClick={handleAsk}
          disabled={loading}
          title={t("send")}
        >
          {loading ? (
            <span className="animate-pulse">...</span>
          ) : (
            <BsArrowUpCircle
              className="w-5 h-5 transition-colors duration-200"
              style={{ color: colors.icon || colors.text || '#000' }}
            />
          )}
        </button>
      </div>
      {error && (
        <div className="text-xs mb-2" style={{ color: colors.error || '#f87171' }} aria-live="polite">{error}</div>
      )}
      {response && (
        <div
          className="text-xs border rounded p-2 max-h-48 overflow-y-auto break-words"
          style={{
            color: colors.accent || '#34d399',
            borderColor: colors.border || '#374151',
            background: colors.bg || 'rgba(0,0,0,0.4)',
          }}
          aria-live="polite"
        >
          <b>IA:</b> {response}
        </div>
      )}
    </div>
  );
}