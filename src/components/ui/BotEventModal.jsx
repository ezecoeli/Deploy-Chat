import React, { useState } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import { BsX, BsCalendarEvent } from 'react-icons/bs';
import { useBotEvents } from '../../hooks/useBotEvents';
import { useTranslation } from '../../hooks/useTranslation';

export default function BotEventModal({ isOpen, onClose, channelId, userId, theme, currentTheme }) {
  const { createEvent, isCreating, error } = useBotEvents(channelId);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleType, setScheduleType] = useState('once');
  const [nextExecution, setNextExecution] = useState('');
  const [cronExpression, setCronExpression] = useState('* * * * *');
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Estilos
  const previewBg = theme.colors.previewBg || '#f3f4f6';
  const previewTextColor = theme.colors.previewText || theme.colors.primary || '#222';
  const modalBg = theme.colors.bgSecondary || theme.colors.bg || '#222';
  const borderColor = theme.colors.border || '#ffcc00';
  const borderStyle = `2px solid ${borderColor}`;
  const textColor = theme.colors.primary || '#222';
  const accentColor = theme.colors.accent || '#6366f1';
  const inputBg = theme.colors.inputBg || '#fff';
  const inputText = theme.colors.inputText || '#222';
  const buttonBg = accentColor;
  const buttonText = theme.colors.buttonText || '#fff';
  const buttonHoverBg = theme.colors.buttonHover 
  const overlayBg = theme.colors.overlayBg || 'rgba(0,0,0,0.85)';
  const fontFamily = theme.font || 'inherit';

  // labels color adjustments for macOS theme
  const labelTextColor =
    currentTheme === 'macOS' && (modalBg === '#c0c0c0' || modalBg === '#e5e7eb')
      ? '#000'
      : currentTheme === 'macOS'
      ? '#fff'
      : textColor;

  // Input styles
  const inputStyle = {
    background: inputBg,
    color: inputText,
    fontFamily,
    borderColor,
  };

  // especific background for date input to ensure readability
  const inputDateBg = theme.colors.inputDateBg || '#f3f4f6';
  const inputDateText = ['#fff', '#ffffff', '#f3f4f6', '#e5e7eb'].includes(inputDateBg.toLowerCase())
    ? '#222'
    : inputText;

  const inputDateStyle = {
    ...inputStyle,
    background: inputDateBg,
    color: inputDateText,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Convert nextExecution to UTC ISO string
    let utcDate = '';
    if (nextExecution) {
      const localDate = new Date(nextExecution);
      utcDate = localDate.toISOString();
    }
    const eventData = {
      title,
      message,
      channel_id: channelId,
      schedule_type: scheduleType,
      cron_expression: cronExpression,
      next_execution: utcDate,
      is_active: true,
      created_by: userId,
      created_at: new Date().toISOString(),
    };
    const ok = await createEvent(eventData);
    if (ok) {
      onClose();
      setTitle('');
      setMessage('');
      setScheduleType('once');
      setNextExecution('');
      setCronExpression('* * * * *');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: overlayBg }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="w-full max-w-xl rounded-lg p-6 shadow-xl relative"
        style={{
          background: modalBg,
          border: borderStyle,
          color: textColor,
          fontFamily,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <BsCalendarEvent className="w-6 h-6" style={{ color: labelTextColor }} />
            <h2 className="text-xl font-bold" style={{ color: labelTextColor }}>{t('scheduleEvent')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:opacity-70 transition-opacity"
            style={{ color: accentColor }}
          >
            <BsX className="w-6 h-6" title={t('close')} />
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t('titleInput')}
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 rounded border"
            style={inputStyle}
          />
          <textarea
            placeholder={t('messageInput')}
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            className="w-full px-3 py-2 rounded"
            style={{
              ...inputStyle,
              border: borderStyle,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div className="flex gap-4 items-center">
            {['once', 'daily', 'weekly', 'monthly'].map(type => (
              <label key={type} className="flex items-center gap-2" style={{ color: labelTextColor }}>
                <input type="radio" value={type} checked={scheduleType === type} onChange={() => setScheduleType(type)} />
                {t(type)}
              </label>
            ))}
          </div>
          <div className="flex gap-4 items-center">
            <FaCalendarAlt className="w-5 h-5" style={{ color: labelTextColor }} />
            <input
              type="datetime-local"
              value={nextExecution}
              onChange={e => setNextExecution(e.target.value)}
              required
              className="px-3 py-2 rounded border"
              style={inputDateStyle}
            />
          </div>
          
          <div className="mt-2">
            <span className="font-semibold" style={{ color: labelTextColor }}>{t('preview')}:</span>
            <div
              className="rounded p-2 mt-1 text-sm"
              style={{
                background: previewBg,
                color: previewTextColor,
                fontFamily,
                border: borderStyle,
              }}
            >
              <strong>{title}</strong><br />
              {message}
            </div>
          </div>
          {error && <div className="text-red-500">{error.message}</div>}
          <button
            type="submit"
            title={t('confirm')}
            disabled={isCreating}
            className="w-full py-2 mt-4 rounded transition"
            style={{
              background: buttonBg,
              color: buttonText,
              fontFamily,
              border: `1px solid ${borderColor}`,
            }}
            onMouseOver={e => e.currentTarget.style.background = buttonHoverBg}
            onMouseOut={e => e.currentTarget.style.background = buttonBg}
          >
            {isCreating ? t('creating') : t("confirm")}
          </button>
        </form>
      </div>
    </div>
  );
}