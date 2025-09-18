import React, { useState } from 'react';
import { useDevStates } from '../../hooks/useDevStates';
import { stateCategories } from '../../data/devStates';
import { useTranslation } from '../../hooks/useTranslation';

export default function DevStateSelector({ 
  user, 
  currentTheme, 
  className = ''
}) {
  const { currentStates, updateState, clearState, loading } = useDevStates(user?.id);
  const [activeTab, setActiveTab] = useState('availability');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const handleStateSelect = async (category, state) => {
    if (isSubmitting || loading) return;
    
    setIsSubmitting(true);
    try {
      await updateState(category.id, state);
    } catch (error) {
      console.error('Error setting state:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearState = async (categoryId) => {
    if (isSubmitting || loading) return;
    
    setIsSubmitting(true);
    try {
      await clearState(categoryId);
    } catch (error) {
      console.error('Error clearing state:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThemeClasses = () => {
    switch (currentTheme) {
      case 'matrix':
        return {
          container: 'bg-black border-green-500 text-green-400',
          tab: 'border-green-500 text-green-400 hover:bg-green-900',
          activeTab: 'bg-green-500 text-black',
          button: 'hover:bg-green-800 text-green-400',
          listItem: 'hover:bg-green-900 border-green-700',
          current: 'bg-green-900 border-green-500'
        };
      case 'coolRetro':
        return {
          container: 'bg-black border-amber-500 text-amber-400',
          tab: 'border-amber-500 text-amber-400 hover:bg-amber-900',
          activeTab: 'bg-amber-500 text-black',
          button: 'hover:bg-amber-800 text-amber-400',
          listItem: 'hover:bg-amber-900 border-amber-700',
          current: 'bg-amber-900 border-amber-500'
        };
      case 'ubuntu':
        return {
          container: 'bg-gray-900 border-orange-500 text-orange-100',
          tab: 'border-orange-500 text-orange-400 hover:bg-orange-900',
          activeTab: 'bg-orange-500 text-white',
          button: 'hover:bg-orange-800 text-orange-100',
          listItem: 'hover:bg-orange-900 border-orange-700',
          current: 'bg-gray-800 border-orange-500'
        };
      case 'windows95':
        return {
          container: 'bg-gray-200 border-gray-400 text-black',
          tab: 'border-gray-400 text-black hover:bg-gray-300',
          activeTab: 'bg-blue-500 text-white',
          button: 'hover:bg-gray-400 text-black border border-gray-500',
          listItem: 'hover:bg-gray-300 border-gray-400',
          current: 'bg-white border-gray-400'
        };
      case 'macOS':
        return {
          container: 'bg-gray-100 border-gray-300 text-gray-800',
          tab: 'border-gray-300 text-gray-600 hover:bg-gray-200',
          activeTab: 'bg-blue-500 text-white',
          button: 'hover:bg-gray-50 text-gray-800 border border-gray-300',
          listItem: 'hover:bg-gray-200 border-gray-300',
          current: 'bg-white border-gray-300'
        };
      default:
        return {
          container: 'bg-gray-800 border-gray-600 text-white',
          tab: 'border-gray-600 text-gray-300 hover:bg-gray-700',
          activeTab: 'bg-blue-500 text-white',
          button: 'hover:bg-gray-600 text-white',
          listItem: 'hover:bg-gray-700 border-gray-600',
          current: 'bg-gray-700 border-gray-600'
        };
    }
  };

  const themeClasses = getThemeClasses();
  const activeCategory = stateCategories.find(cat => cat.id === activeTab);

  return (
    <div className={`border rounded-lg p-2 w-full ${themeClasses.container} ${className}`}>
      {/* Compact Tabs - Vertical para que quepan */}
      <div className="grid grid-cols-3 gap-1 text-xs mb-2">
        {stateCategories.map(category => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              disabled={isSubmitting}
              className={`flex flex-col items-center gap-1 px-1 py-1 font-mono text-xs rounded transition-colors ${
                activeTab === category.id 
                  ? themeClasses.activeTab
                  : themeClasses.tab
              }`}
            >
              <IconComponent className="w-3 h-3" />
              <span className="text-xs leading-none truncate w-full text-center">
                {t(category.id)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current State Display */}
      {currentStates[activeTab] && (
        <div className={`mb-2 p-2 rounded text-xs ${themeClasses.current} border-opacity-50`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: currentStates[activeTab].color }}
            />
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xs font-medium truncate">
                {t('current')}: {activeCategory?.states.find(s => s.id === currentStates[activeTab].id)?.label}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* State Options */}
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {activeCategory?.states.map(state => {
          const IconComponent = state.icon;
          const isActive = currentStates[activeTab]?.id === state.id;
          
          return (
            <button
              key={state.id}
              onClick={() => handleStateSelect(activeCategory, state)}
              disabled={isSubmitting || loading}
              className={`w-full p-2 rounded border text-left transition-all text-xs ${
                isActive 
                  ? `border-opacity-100 ${themeClasses.activeTab}` 
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
                  <div className="font-mono text-xs font-medium">{state.label}</div>
                  <div className="text-xs opacity-75 truncate">{state.description}</div>
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

      {/* Loading state */}
      {(loading || isSubmitting) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        </div>
      )}
    </div>
  );
}