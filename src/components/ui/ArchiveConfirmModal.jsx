import React from 'react';
import { BsX, BsExclamationTriangle } from 'react-icons/bs';

export default function ArchiveConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar",
  theme,
  currentTheme,
  type = "warning"
}) {
  if (!isOpen) return null;

  const getThemeStyles = () => {
    switch (currentTheme) {
      case 'matrix':
        return {
          overlay: 'bg-black/80',
          modal: 'bg-black border-2 border-green-500/50 text-green-300',
          title: 'text-green-400',
          confirmBtn: 'bg-green-600 hover:bg-green-700 text-black border-green-500',
          cancelBtn: 'bg-gray-800 hover:bg-gray-700 text-green-300 border-green-500/30',
          icon: 'text-green-400'
        };
      case 'coolRetro':
        return {
          overlay: 'bg-black/80',
          modal: 'bg-black border-2 border-cyan-400/50 text-cyan-300',
          title: 'text-cyan-400',
          confirmBtn: 'bg-cyan-600 hover:bg-cyan-700 text-black border-cyan-400',
          cancelBtn: 'bg-gray-800 hover:bg-gray-700 text-cyan-300 border-cyan-400/30',
          icon: 'text-cyan-400'
        };
      case 'windows95':
        return {
          overlay: 'bg-gray-500/50',
          modal: 'bg-gray-200 border-2 border-gray-400 text-black shadow-lg',
          title: 'text-blue-800',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700',
          cancelBtn: 'bg-gray-300 hover:bg-gray-400 text-black border-gray-500',
          icon: 'text-red-600'
        };
      case 'ubuntu':
        return {
          overlay: 'bg-black/80',
          modal: 'bg-gray-800 border-2 border-orange-500/50 text-orange-200',
          title: 'text-orange-400',
          confirmBtn: 'bg-orange-600 hover:bg-orange-700 text-white border-orange-500',
          cancelBtn: 'bg-gray-700 hover:bg-gray-600 text-orange-200 border-orange-500/30',
          icon: 'text-orange-400'
        };
      case 'macOS':
      return {
        overlay: 'bg-black/40',
        modal: 'bg-white border border-gray-300 text-gray-800 shadow-2xl backdrop-blur-sm',
        title: 'text-gray-900',
        confirmBtn: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-sm',
        cancelBtn: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 shadow-sm',
        icon: 'text-orange-500' 
      };
      default:
        return {
          overlay: 'bg-black/50',
          modal: 'bg-gray-800 border border-gray-600 text-white',
          title: 'text-white',
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
          cancelBtn: 'bg-gray-600 hover:bg-gray-500 text-white border-gray-500',
          icon: 'text-yellow-400'
        };
    }
  };

  const styles = getThemeStyles();

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${styles.overlay}`}
      onClick={handleOverlayClick}
    >
      <div 
        className={`w-full max-w-md rounded-lg p-6 ${styles.modal}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BsExclamationTriangle className={`w-6 h-6 ${styles.icon}`} />
            <h3 className={`text-lg font-bold ${styles.title}`}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:opacity-70 transition-opacity"
          >
            <BsX className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors border ${styles.cancelBtn}`}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors border ${styles.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}