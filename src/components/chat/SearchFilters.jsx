import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useTranslation } from '../../hooks/useTranslation';

export default function SearchFilters({ 
  filters, 
  onFiltersChange, 
  user, 
  theme, 
  currentTheme 
}) {
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    loadChannels();
    loadUsers();
  }, []);

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('id, name, type')
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('name');
      
      if (!error) {
        setChannels(data || []);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email')
        .order('username');
      
      if (!error) {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const getFilterStyles = () => {
    switch (currentTheme) {
      case 'matrix':
        return {
          container: 'bg-black/90 border-green-500/30 text-green-400',
          select: 'bg-black border-green-500/50 text-green-400',
          input: 'bg-black border-green-500/50 text-green-400'
        };
      case 'coolRetro':
        return {
          container: 'bg-black/90 border-cyan-400/30 text-cyan-400',
          select: 'bg-black border-cyan-400/50 text-cyan-400',
          input: 'bg-black border-cyan-400/50 text-cyan-400'
        };
      case 'windows95':
        return {
          container: 'bg-gray-200 border-gray-400 text-black',
          select: 'bg-white border-gray-400 text-black',
          input: 'bg-white border-gray-400 text-black'
        };
      default:
        return {
          container: 'bg-gray-800/90 border-gray-600 text-white',
          select: 'bg-gray-700 border-gray-600 text-white',
          input: 'bg-gray-700 border-gray-600 text-white'
        };
    }
  };

  const styles = getFilterStyles();

  return (
    <div className={`p-4 border-b space-y-3 ${styles.container}`}>
      <h4 className="text-sm font-bold font-mono">{t("searchFilters")}</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Channel filter */}
        <div>
          <label className="block text-xs font-mono mb-1">{t("channel")}</label>
          <select
            value={filters.channelId || ''}
            onChange={(e) => onFiltersChange({ channelId: e.target.value || null })}
            className={`w-full px-2 py-1 rounded text-sm font-mono ${styles.select}`}
          >
            <option value="">{t("allChannels")}</option>
            {channels.map(channel => (
              <option key={channel.id} value={channel.id}>
                {channel.type === 'public' ? '#' : '@'}{channel.name}
              </option>
            ))}
          </select>
        </div>

        {/* User filter */}
        <div>
          <label className="block text-xs font-mono mb-1">{t("user")}</label>
          <select
            value={filters.userId || ''}
            onChange={(e) => onFiltersChange({ userId: e.target.value || null })}
            className={`w-full px-2 py-1 rounded text-sm font-mono ${styles.select}`}
          >
            <option value="">{t("allUsers")}</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username || user.email}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div>
          <label className="block text-xs font-mono mb-1">{t("from")}</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFiltersChange({ startDate: e.target.value || null })}
            className={`w-full px-2 py-1 rounded text-sm font-mono ${styles.input}`}
          />
        </div>

        <div>
          <label className="block text-xs font-mono mb-1">{t("to")}</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFiltersChange({ endDate: e.target.value || null })}
            className={`w-full px-2 py-1 rounded text-sm font-mono ${styles.input}`}
          />
        </div>
      </div>

      {/* Clear filters button */}
      <button
        onClick={() => onFiltersChange({ 
          channelId: null, 
          userId: null, 
          startDate: null, 
          endDate: null 
        })}
        className="text-xs font-mono opacity-70 hover:opacity-100 transition-opacity"
      >
        {t("clearFilters")}
      </button>
    </div>
  );
}