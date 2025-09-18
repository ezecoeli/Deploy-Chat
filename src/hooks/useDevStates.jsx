import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useDevStates(userId) {
  const [currentStates, setCurrentStates] = useState({
    work: null,
    mood: null,
    availability: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCurrentStates = useCallback(async () => {
    if (!userId) {
      setCurrentStates({ work: null, mood: null, availability: null });
      return;
    }
    
    try {
      setError(null);
      const { data, error } = await supabase
        .from('user_states')
        .select('*')
        .eq('user_id', userId)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const states = {
        work: null,
        mood: null,
        availability: null
      };

      data.forEach(state => {
        if (state.state_type && ['work', 'mood', 'availability'].includes(state.state_type)) {
          states[state.state_type] = {
            id: state.state_id,
            emoji: state.emoji,
            color: state.color,
          };
        }
      });

      setCurrentStates(states);
    } catch (error) {
      console.error('Error fetching states:', error);
      setError(error.message);
    }
  }, [userId]);

  const updateState = useCallback(async (type, stateData, duration = null, customMessage = null) => {
    if (!userId || !type || !stateData) return;

    setLoading(true);
    setError(null);
    
    try {
      const expiresAt = duration ? 
        new Date(Date.now() + duration * 60 * 1000).toISOString() : null;

      const { error } = await supabase
        .from('user_states')
        .upsert({
          user_id: userId,
          state_type: type,
          state_id: stateData.id,
          emoji: stateData.emoji || null,
          color: stateData.color,
          custom_message: customMessage,
          expires_at: expiresAt
        }, {
          onConflict: 'user_id, state_type'
        });

      if (error) throw error;
      
      await fetchCurrentStates();
    } catch (error) {
      console.error('Error updating state:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchCurrentStates]);

  const clearState = useCallback(async (type) => {
    if (!userId || !type) return;

    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('user_states')
        .delete()
        .eq('user_id', userId)
        .eq('state_type', type);

      if (error) throw error;
      
      await fetchCurrentStates();
    } catch (error) {
      console.error('Error clearing state:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchCurrentStates]);

  const clearAllStates = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('user_states')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      
      await fetchCurrentStates();
    } catch (error) {
      console.error('Error clearing all states:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchCurrentStates]);

  const isStateExpired = useCallback((state) => {
    if (!state || !state.expiresAt) return false;
    return new Date(state.expiresAt) <= new Date();
  }, []);

  const getTimeUntilExpiry = useCallback((state) => {
    if (!state || !state.expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(state.expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return null;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }, []);

  useEffect(() => {
    fetchCurrentStates();

    if (!userId) return;

    const subscription = supabase
      .channel(`user-states-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_states',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          fetchCurrentStates();
        }
      )
      .subscribe();

    const cleanupInterval = setInterval(() => {
      fetchCurrentStates();
    }, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(cleanupInterval);
    };
  }, [userId, fetchCurrentStates]);

  return {
    currentStates,
    updateState,
    clearState,
    clearAllStates,
    loading,
    error,
    refetch: fetchCurrentStates,
    isStateExpired,
    getTimeUntilExpiry
  };
}

export function useAllUsersStates() {
  const [allStates, setAllStates] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllStates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: statesData, error: statesError } = await supabase
        .from('user_states')
        .select('*')
        .or('expires_at.is.null,expires_at.gt.now()');

      if (statesError) throw statesError;

      // get unique user IDs
      const userIds = [...new Set(statesData.map(state => state.user_id))];

      // get user details
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (usersError) throw usersError;

      const usersMap = {};
      usersData.forEach(user => {
        usersMap[user.id] = user;
      });

      const statesByUser = {};
      
      statesData.forEach(state => {
        const userId = state.user_id;
        if (!statesByUser[userId]) {
          statesByUser[userId] = {
            work: null,
            mood: null,
            availability: null,
            user: usersMap[userId] || null
          };
        }
        
        if (state.state_type && ['work', 'mood', 'availability'].includes(state.state_type)) {
          statesByUser[userId][state.state_type] = {
            id: state.state_id,
            emoji: state.emoji,
            color: state.color,
            customMessage: state.custom_message
          };
        }
      });

      setAllStates(statesByUser);
    } catch (error) {
      console.error('Error fetching all states:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllStates();

    const subscription = supabase
      .channel('all-user-states')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_states'
        }, 
        () => fetchAllStates()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAllStates]);

  return {
    allStates,
    loading,
    error,
    refetch: fetchAllStates
  };
}