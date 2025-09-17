import React, { useState } from 'react';
import { BsSearch, BsX, BsFilter } from 'react-icons/bs';
import { useTranslation } from '../../hooks/useTranslation';

export default function SearchBar({ 
  searchQuery, 
  onQueryChange, 
  onToggleFilters,
  showFilters,
  theme, 
  currentTheme, 
  isSearching,
  resultCount = 0 
}) {
  const [isFocused, setIsFocused] = useState(false);
  const { t } = useTranslation();

  const getSearchStyles = () => {
    switch (currentTheme) {
      case 'matrix':
        return {
          container: 'bg-black/80 border-green-500/50 text-green-400',
          input: 'text-green-400 placeholder-green-600',
          button: 'text-green-400 hover:text-green-300 hover:bg-green-500/20'
        };
      case 'coolRetro':
        return {
          container: 'bg-black/80 border-cyan-400/50 text-cyan-400',
          input: 'text-cyan-400 placeholder-cyan-600',
          button: 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/20'
        };
      case 'ubuntu':
        return {
          container: 'bg-gray-900/80 border-orange-400/50 text-orange-200',
          input: 'text-orange-200 placeholder-orange-600',
          button: 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/20'
        };
      case 'windows95':
        return {
          container: 'bg-gray-200 border-gray-400 text-black',
          input: 'text-black placeholder-gray-500',
          button: 'text-gray-700 hover:text-black hover:bg-gray-300'
        };
      case 'macOS':
        return {
          container: 'bg-white/90 border-gray-300 text-gray-800',
          input: 'text-gray-800 placeholder-gray-500',
          button: 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
        };
      default:
        return {
          container: 'bg-gray-800/80 border-gray-600 text-white',
          input: 'text-white placeholder-gray-400',
          button: 'text-gray-400 hover:text-white hover:bg-gray-700'
        };
    }
  };

  const styles = getSearchStyles();

  return (
    <div className={`border-b ${styles.container}`} style={{ borderColor: theme.colors.border }}>
      {/* Search input section */}
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1">
          <div className={`flex items-center border rounded-lg px-3 py-2 transition-all ${styles.container} ${isFocused ? 'ring-2 ring-blue-500/50' : ''}`}>
            <BsSearch className={`w-4 h-4 mr-2 ${styles.button}`} />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`flex-1 bg-transparent outline-none font-mono text-sm ${styles.input}`}
            />
            {searchQuery && (
              <button
                onClick={() => onQueryChange('')}
                className={`ml-2 p-1 rounded transition-colors ${styles.button}`}
              >
                <BsX className="w-4 h-4" title={t("clearSearch")} />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onToggleFilters}
          className={`p-2 rounded transition-colors ${styles.button} ${showFilters ? 'bg-blue-500/20' : ''}`}
          title={t("searchFilters")}
        >
          <BsFilter className="w-5 h-5" />
        </button>
      </div>

      {/* Search status section */}
      {searchQuery && (
        <div className={`px-3 pb-2 text-xs ${styles.input}`}>
          {isSearching ? (
            <span className="opacity-70">{t("searching")}</span>
          ) : (
            <span className="opacity-70">
              {resultCount > 0 ? t("searchResultsCount").replace("{count}", resultCount) : t("noSearchResults")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}