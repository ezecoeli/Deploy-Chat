import React, { useState } from 'react';
import { BsX } from 'react-icons/bs';
import { useMessageSearch } from '../../hooks/useMessageSearch';
import SearchBar from '../chat/SearchBar';
import SearchFilters from '../chat/SearchFilters';
import SearchResults from '../chat/SearchResults';
import { useTranslation } from '../../hooks/useTranslation';

export default function SearchModal({ 
  isOpen, 
  onClose, 
  user, 
  theme, 
  currentTheme ,
  onNavigateToMessage
}) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    searchResults,
    isSearching,
    searchQuery,
    filters,
    updateQuery,
    updateFilters,
  } = useMessageSearch(user);

  const handleSelectMessage = (message) => {
    // Navigate to the selected message in the chat and close the modal
    if (onNavigateToMessage) {
      onNavigateToMessage(message);
    }
    onClose();
  };

  const getModalStyles = () => {
    switch (currentTheme) {
      case 'matrix':
        return 'bg-black/95 border-green-500/50 text-green-400';
      case 'coolRetro':
        return 'bg-black/95 border-cyan-400/50 text-cyan-400';
      case 'windows95':
        return 'bg-gray-200 border-gray-400 text-black';
      case 'macOS':
        return 'bg-white/95 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-900/95 border-gray-600 text-white';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-4xl h-[80vh] rounded-lg border ${getModalStyles()}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.colors.border }}>
          <h2 className="text-lg font-bold font-mono">
            {t("searchMessages")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-600 transition-colors"
          >
            <BsX className="w-5 h-5" title={t("close")} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100%-5rem)]">
          <SearchBar
            searchQuery={searchQuery}
            onQueryChange={updateQuery}
            onToggleFilters={() => setShowFilters(!showFilters)}
            showFilters={showFilters}
            theme={theme}
            currentTheme={currentTheme}
            isSearching={isSearching}
            resultCount={searchResults.length}
          />

          {showFilters && (
            <SearchFilters
              filters={filters}
              onFiltersChange={updateFilters}
              user={user}
              theme={theme}
              currentTheme={currentTheme}
            />
          )}

          <SearchResults
            results={searchResults}
            onSelectMessage={handleSelectMessage}
            theme={theme}
            currentTheme={currentTheme}
            searchQuery={searchQuery}
          />
        </div>
      </div>
    </div>
  );
}