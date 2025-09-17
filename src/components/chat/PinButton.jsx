import React, { useState } from 'react';
import { BsPinAngle, BsPinAngleFill } from 'react-icons/bs';
import { useTranslation } from '../../hooks/useTranslation';

export default function PinButton({ 
  message, 
  isPinned, 
  onPin, 
  onUnpin, 
  canPinMore, 
  theme, 
  currentTheme 
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const getButtonStyles = () => {
    switch (currentTheme) {
      case 'matrix':
        return isPinned 
          ? 'text-green-400 hover:text-green-300 bg-green-500/20'
          : 'text-green-600 hover:text-green-400 hover:bg-green-500/20';
      case 'coolRetro':
        return isPinned 
          ? 'text-cyan-400 hover:text-cyan-300 bg-cyan-400/20'
          : 'text-cyan-600 hover:text-cyan-400 hover:bg-cyan-400/20';
      case 'ubuntu':
        return isPinned 
          ? 'text-orange-400 hover:text-orange-300 bg-orange-500/20'
          : 'text-orange-600 hover:text-orange-400 hover:bg-orange-500/20';
      case 'windows95':
        return isPinned 
          ? 'text-black bg-gray-200 border-2 border-gray-400 hover:bg-gray-100'
          : 'text-black bg-gray-300 border-2 border-gray-500 hover:bg-gray-200';
      case 'macOS':
        return isPinned 
          ? 'text-blue-600 hover:text-blue-800 bg-blue-50'
          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-25';
      default:
        return isPinned 
          ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-500/20'
          : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/20';
    }
  };

  const handleClick = async (e) => {
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);
    
    try {
      if (isPinned) {
        await onUnpin(message.id);
      } else {
        if (!canPinMore) {
          alert(t("maxPinnedReached"));
          return;
        }
        await onPin(message.id);
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || (!isPinned && !canPinMore);

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`p-1 rounded transition-all opacity-0 group-hover:opacity-100 ${getButtonStyles()} ${
        isDisabled ? 'opacity-30 cursor-not-allowed' : ''
      }`}
      title={isPinned ? t("unpinMessage") : t("pinMessage")}
    >
      {loading ? (
        <div className="w-4 h-4 animate-spin border border-current border-t-transparent rounded-full" />
      ) : isPinned ? (
        <BsPinAngleFill className="w-5 h-5" />
      ) : (
        <BsPinAngle className="w-5 h-5" />
      )}
    </button>
  );
}