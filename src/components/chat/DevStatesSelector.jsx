import React, { useState } from 'react';
import { useDevStatesContext } from '../../hooks/useDevStatesContext';
import { allStates } from '../../data/devStates';
import { useTranslation } from '../../hooks/useTranslation';

export default function DevStateSelector({ 
  user, 
  currentTheme, 
  className = ''
}) {
  const { allUserStates, updateUserState, loading } = useDevStatesContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const currentStates = allUserStates[user?.id] || {
    work: null,
    mood: null,
    availability: null
  };

  const getCurrentState = () => {
    for (const category of ['availability', 'work', 'mood']) {
      if (currentStates[category]) {
        return currentStates[category];
      }
    }
    return null;
  };

  const currentState = getCurrentState();

  const handleStateSelect = async (state) => {
    if (isSubmitting || loading) return;
    
    console.log('[DevStatesSelector] Selecting state:', state);
    
    setIsSubmitting(true);
    try {
      const success = await updateUserState(user?.id, 'status', state);
      if (success) {
        console.log('[DevStatesSelector] State updated successfully');
      } else {
        console.error('[DevStatesSelector] Failed to update state');
      }
    } catch (error) {
      console.error('[DevStatesSelector] Error setting state:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThemeClasses = () => {
    switch (currentTheme) {
      case 'matrix':
        return {
          container: 'bg-black border-green-500 text-green-400',
          listItem: 'hover:bg-green-900 border-green-700',
          current: 'bg-green-900 border-green-500',
          activeItem: 'bg-green-500 text-black'
        };
      case 'coolRetro':
        return {
          container: 'bg-black border-amber-500 text-amber-400',
          listItem: 'hover:bg-amber-900 border-amber-700',
          current: 'bg-amber-900 border-amber-500',
          activeItem: 'bg-amber-500 text-black'
        };
      case 'ubuntu':
        return {
          container: 'bg-gray-900 border-orange-500 text-orange-100',
          listItem: 'hover:bg-orange-900 border-orange-700',
          current: 'bg-gray-800 border-orange-500',
          activeItem: 'bg-orange-500 text-white'
        };
      case 'windows95':
        return {
          container: 'bg-gray-200 border-gray-400 text-black',
          listItem: 'hover:bg-gray-300 border-gray-400',
          current: 'bg-white border-gray-400',
          activeItem: 'bg-blue-500 text-white'
        };
      case 'macOS':
        return {
          container: 'bg-gray-100 border-gray-300 text-gray-800',
          listItem: 'hover:bg-gray-200 border-gray-300',
          current: 'bg-white border-gray-300',
          activeItem: 'bg-blue-500 text-white'
        };
      default:
        return {
          container: 'bg-gray-800 border-gray-600 text-white',
          listItem: 'hover:bg-gray-700 border-gray-600',
          current: 'bg-gray-700 border-gray-600',
          activeItem: 'bg-blue-500 text-white'
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`border rounded-lg p-2 w-full ${themeClasses.container} ${className}`}>
      
      {currentState && (
        <div className={`mb-2 p-2 rounded text-xs ${themeClasses.current} border-opacity-50`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: currentState.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xs font-medium truncate">
                {t('current')}: {allStates.find(s => s.id === currentState.id)?.labelKey ? 
                  t(allStates.find(s => s.id === currentState.id).labelKey) :
                  allStates.find(s => s.id === currentState.id)?.label || 'Unknown'
                }
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {allStates.map(state => {
          const IconComponent = state.icon;
          const isActive = currentState?.id === state.id;
          
          return (
            <button
              key={state.id}
              onClick={() => handleStateSelect(state)}
              disabled={isSubmitting || loading}
              className={`w-full p-2 rounded border text-left transition-all text-xs ${
                isActive 
                  ? `border-opacity-100 ${themeClasses.activeItem}` 
                  : `border-opacity-30 ${themeClasses.listItem}`
              }`}
              style={{
                borderColor: state.color
              }}
            >
              <div className="flex items-center gap-2">
                <IconComponent 
                  className="w-3 h-3 flex-shrink-0" 
                  style={{ color: isActive ? 'currentColor' : state.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs font-medium">
                    {state.labelKey ? t(state.labelKey) : state.label}
                  </div>
                </div>
                {isActive && (
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: state.color }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {(loading || isSubmitting) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        </div>
      )}
    </div>
  );
}