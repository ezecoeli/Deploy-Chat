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
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      // Reset all states
      const states = {
        work: null,
        mood: null,
        availability: null
      };

      // If there is a state, put it in its corresponding category
      if (data && data.length > 0) {
        const state = data[0];
        if (state.state_type && ['work', 'mood', 'availability'].includes(state.state_type)) {
          states[state.state_type] = {
            id: state.state_id,
            emoji: state.emoji,
            color: state.color,
          };
        }
      }

      setCurrentStates(states);
    } catch (error) {
      console.error('Error fetching states:', error);
      setError(error.message);
    }
  }, [userId]);

  const updateState = useCallback(async (type, stateData) => {
    if (!userId || !type || !stateData) return;

    setLoading(true);
    setError(null);
    
    try {
      // Delete ALL existing states for the user
      await supabase
        .from('user_states')
        .delete()
        .eq('user_id', userId);

      // insert new state
      const { error } = await supabase
        .from('user_states')
        .insert({
          user_id: userId,
          state_type: type,
          state_id: stateData.id,
          emoji: stateData.emoji || null,
          color: stateData.color,
          expires_at: null
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
      console.error('Error clearing state:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchCurrentStates]);

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
        () => {
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
    loading,
    error,
    refetch: fetchCurrentStates
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

      const userIds = [...new Set(statesData.map(state => state.user_id))];

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
            color: state.color
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