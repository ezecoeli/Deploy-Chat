import { useState, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

export const useMessageSearch = (user) => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    channelId: null,
    userId: null,
    startDate: null,
    endDate: null
  });
  
  const debounceRef = useRef(null);

  const searchMessages = useCallback(async (query, searchFilters = {}) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      
      let searchQuery = supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          channel_id,
          user_id,
          users:user_id (
            id,
            email,
            username,
            avatar_url
          ),
          channels:channel_id (
            id,
            name,
            type
          )
        `)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      // Apply filters
      if (searchFilters.channelId) {
        searchQuery = searchQuery.eq('channel_id', searchFilters.channelId);
      }
      
      if (searchFilters.userId) {
        searchQuery = searchQuery.eq('user_id', searchFilters.userId);
      }
      
      if (searchFilters.startDate) {
        searchQuery = searchQuery.gte('created_at', searchFilters.startDate);
      }
      
      if (searchFilters.endDate) {
        searchQuery = searchQuery.lte('created_at', searchFilters.endDate);
      }

      const { data, error } = await searchQuery;
      
      if (error) throw error;
      
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching messages:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback((query, searchFilters) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchMessages(query, searchFilters);
    }, 300);
  }, [searchMessages]);

  const updateQuery = useCallback((query) => {
    setSearchQuery(query);
    debouncedSearch(query, filters);
  }, [debouncedSearch, filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery, { ...filters, ...newFilters });
    }
  }, [debouncedSearch, searchQuery, filters]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setFilters({
      channelId: null,
      userId: null,
      startDate: null,
      endDate: null
    });
  }, []);

  return {
    searchResults,
    isSearching,
    searchQuery,
    filters,
    updateQuery,
    updateFilters,
    clearSearch
  };
};