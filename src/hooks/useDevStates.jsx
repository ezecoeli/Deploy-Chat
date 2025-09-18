import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useDevStates(userId) {
  const [currentStates, setCurrentStates] = useState({
    work: null,
    mood: null,
    availability: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const userIdRef = useRef(userId);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const fetchCurrentStates = useCallback(async (targetUserId = null) => {
    const currentUserId = targetUserId || userIdRef.current;
    
    if (!currentUserId || isUnmountedRef.current) {
      setCurrentStates({ work: null, mood: null, availability: null });
      return;
    }
    
    try {
      setError(null);
      console.log(`[useDevStates] Fetching states for user: ${currentUserId}`);
      
      const { data, error } = await supabase
        .from('user_states')
        .select('*')
        .eq('user_id', currentUserId)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (isUnmountedRef.current) return;

      const states = {
        work: null,
        mood: null,
        availability: null
      };

      if (data && data.length > 0) {
        const state = data[0];
        console.log(`[useDevStates] Found state:`, state);
        
        if (state.state_type && ['work', 'mood', 'availability'].includes(state.state_type)) {
          states[state.state_type] = {
            id: state.state_id,
            emoji: state.emoji,
            color: state.color,
          };
        }
      }

      console.log(`[useDevStates] Setting states:`, states);
      setCurrentStates(states);
    } catch (error) {
      if (!isUnmountedRef.current) {
        console.error('[useDevStates] Error fetching states:', error);
        setError(error.message);
      }
    }
  }, []);

  const updateState = useCallback(async (type, stateData) => {
    const currentUserId = userIdRef.current;
    if (!currentUserId || !type || !stateData) return;

    setLoading(true);
    setError(null);
    
    try {
      console.log(`[useDevStates] Updating state for user ${currentUserId}:`, { type, stateData });
      
      // remove existing state of this type
      const { error: deleteError } = await supabase
        .from('user_states')
        .delete()
        .eq('user_id', currentUserId);

      if (deleteError) {
        console.error('[useDevStates] Delete error:', deleteError);
        throw deleteError;
      }

      // Insert new state
      const { data: insertData, error: insertError } = await supabase
        .from('user_states')
        .insert({
          user_id: currentUserId,
          state_type: type,
          state_id: stateData.id,
          emoji: stateData.emoji || null,
          color: stateData.color,
          expires_at: null
        })
        .select();

      if (insertError) {
        console.error('[useDevStates] Insert error:', insertError);
        throw insertError;
      }

      console.log('[useDevStates] State updated successfully:', insertData);
      
      // update local state
      if (!isUnmountedRef.current) {
        const newStates = {
          work: null,
          mood: null,
          availability: null
        };
        newStates[type] = {
          id: stateData.id,
          emoji: stateData.emoji || null,
          color: stateData.color,
        };
        setCurrentStates(newStates);
      }
      
    } catch (error) {
      if (!isUnmountedRef.current) {
        console.error('[useDevStates] Error updating state:', error);
        setError(error.message);
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const clearState = useCallback(async () => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    setLoading(true);
    setError(null);
    
    try {
      console.log(`[useDevStates] Clearing all states for user: ${currentUserId}`);
      
      const { error } = await supabase
        .from('user_states')
        .delete()
        .eq('user_id', currentUserId);

      if (error) throw error;
      
      if (!isUnmountedRef.current) {
        console.log('[useDevStates] States cleared successfully');
        setCurrentStates({ work: null, mood: null, availability: null });
      }
    } catch (error) {
      if (!isUnmountedRef.current) {
        console.error('[useDevStates] Error clearing state:', error);
        setError(error.message);
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Effect to fetch states and set up subscription
  useEffect(() => {
    isUnmountedRef.current = false;
    
    if (!userId) {
      setCurrentStates({ work: null, mood: null, availability: null });
      return;
    }

    // initial fetch
    fetchCurrentStates(userId);

    console.log(`[useDevStates] Setting up subscription for user: ${userId}`);

    // unique subscription name per user
    const channelName = `user-states-${userId}`;
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_states',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          console.log('[useDevStates] Received realtime update:', payload);
          // Refetch after delay to avoid multiple updates
          setTimeout(() => {
            if (!isUnmountedRef.current) {
              fetchCurrentStates(userId);
            }
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log(`[useDevStates] Subscription status:`, status);
      });

    return () => {
      console.log(`[useDevStates] Cleaning up subscription for user: ${userId}`);
      isUnmountedRef.current = true;
      subscription.unsubscribe();
    };
  }, [userId, fetchCurrentStates]);

  return {
    currentStates,
    updateState,
    clearState,
    loading,
    error,
    refetch: () => fetchCurrentStates(userId)
  };
}

export function useAllUsersStates() {
  const [allStates, setAllStates] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isUnmountedRef = useRef(false);

  const fetchAllStates = useCallback(async () => {
    if (isUnmountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[useAllUsersStates] Fetching all user states...');
      
      const { data: statesData, error: statesError } = await supabase
        .from('user_states')
        .select('*')
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false });

      if (statesError) throw statesError;
      if (isUnmountedRef.current) return;

      const userIds = [...new Set(statesData.map(state => state.user_id))];

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (usersError) throw usersError;
      if (isUnmountedRef.current) return;

      const usersMap = {};
      usersData.forEach(user => {
        usersMap[user.id] = user;
      });

      const statesByUser = {};
      
      // keep only the latest state per type for each user
      const latestStatesByUser = {};
      statesData.forEach(state => {
        if (!latestStatesByUser[state.user_id] || 
            new Date(state.created_at) > new Date(latestStatesByUser[state.user_id].created_at)) {
          latestStatesByUser[state.user_id] = state;
        }
      });

      Object.values(latestStatesByUser).forEach(state => {
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

      if (!isUnmountedRef.current) {
        console.log('[useAllUsersStates] Processed states:', statesByUser);
        setAllStates(statesByUser);
      }
    } catch (error) {
      if (!isUnmountedRef.current) {
        console.error('[useAllUsersStates] Error fetching all states:', error);
        setError(error.message);
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isUnmountedRef.current = false;
    fetchAllStates();

    console.log('[useAllUsersStates] Setting up global subscription...');

    const subscription = supabase
      .channel('all-user-states-global')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_states'
        }, 
        (payload) => {
          console.log('[useAllUsersStates] Received realtime update:', payload);
          // Delay to avoid multiple updates
          setTimeout(() => {
            if (!isUnmountedRef.current) {
              fetchAllStates();
            }
          }, 200);
        }
      )
      .subscribe((status) => {
        console.log('[useAllUsersStates] Subscription status:', status);
      });

    return () => {
      console.log('[useAllUsersStates] Cleaning up subscription...');
      isUnmountedRef.current = true;
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