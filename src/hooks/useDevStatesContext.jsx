import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

const DevStatesContext = createContext();

export function DevStatesProvider({ children }) {
  const [allUserStates, setAllUserStates] = useState({});
  const [loading, setLoading] = useState(false);
  const isUnmountedRef = useRef(false);
  const subscriptionRef = useRef(null);
  const broadcastChannelRef = useRef(null);

  const fetchAllStates = useCallback(async () => {
    if (isUnmountedRef.current) return;
    
    try {
      setLoading(true);
      console.log('[DevStatesContext] Fetching all user states...');
      
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
        
        if (state.state_type && ['work', 'mood', 'availability', 'status'].includes(state.state_type)) {
          if (state.state_type === 'status') {
            statesByUser[userId] = {
              work: null,
              mood: null,
              availability: {
                id: state.state_id,
                emoji: state.emoji,
                color: state.color
              },
              user: usersMap[userId] || null
            };
          } else {
            statesByUser[userId][state.state_type] = {
              id: state.state_id,
              emoji: state.emoji,
              color: state.color
            };
          }
        }
      });

      console.log('[DevStatesContext] States updated:', statesByUser);
      setAllUserStates(statesByUser);
    } catch (error) {
      if (!isUnmountedRef.current) {
        console.error('[DevStatesContext] Error fetching states:', error);
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const updateUserState = useCallback(async (userId, type, stateData) => {
    if (!userId || !type || !stateData) return;

    try {
      console.log(`[DevStatesContext] Updating state for user ${userId}:`, { type, stateData });
      
      const { error: deleteError } = await supabase
        .from('user_states')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const actualType = type === 'status' ? 'availability' : type;

      const { data: insertData, error: insertError } = await supabase
        .from('user_states')
        .insert({
          user_id: userId,
          state_type: actualType,
          state_id: stateData.id,
          emoji: stateData.emoji || null,
          color: stateData.color,
          expires_at: null
        })
        .select();

      if (insertError) throw insertError;

      console.log('[DevStatesContext] State updated successfully, broadcasting...');
      
      setAllUserStates(prev => ({
        ...prev,
        [userId]: {
          work: null,
          mood: null,
          availability: null,
          ...prev[userId],
          [actualType]: {
            id: stateData.id,
            emoji: stateData.emoji || null,
            color: stateData.color,
            created_at: new Date().toISOString()
          }
        }
      }));

      if (broadcastChannelRef.current) {
        console.log('[DevStatesContext] Broadcasting to channel...');
        await broadcastChannelRef.current.send({
          type: 'broadcast',
          event: 'state_updated',
          payload: {
            userId,
            type: actualType,
            stateData: {
              id: stateData.id,
              emoji: stateData.emoji || null,
              color: stateData.color,
              created_at: new Date().toISOString()
            }
          }
        });
        console.log('[DevStatesContext] Broadcast sent successfully');
      }

      return true;
    } catch (error) {
      console.error('[DevStatesContext] Error updating state:', error);
      return false;
    }
  }, []);

  const handleDatabaseChange = useCallback((payload) => {
    console.log('[DevStatesContext] Database change received:', payload);
    
    setTimeout(() => {
      if (!isUnmountedRef.current) {
        fetchAllStates();
      }
    }, 50);
  }, [fetchAllStates]);

  const handleBroadcastUpdate = useCallback((payload) => {
    console.log('[DevStatesContext] Broadcast update received:', payload);
    
    if (payload.event === 'state_updated') {
      const { userId, type, stateData } = payload.payload;
      console.log(`[DevStatesContext] Applying broadcast update for user ${userId}, type ${type}`);
      
      setAllUserStates(prev => ({
        ...prev,
        [userId]: {
          work: null,
          mood: null,
          availability: null,
          ...prev[userId],
          [type]: stateData
        }
      }));
    }
  }, []);

  useEffect(() => {
    isUnmountedRef.current = false;
    fetchAllStates();

    console.log('[DevStatesContext] Setting up enhanced subscriptions...');

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.unsubscribe();
    }

    const dbSubscription = supabase
      .channel('dev-states-db')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_states'
        }, 
        handleDatabaseChange
      )
      .subscribe((status) => {
        console.log('[DevStatesContext] Database subscription status:', status);
      });

    const broadcastSubscription = supabase
      .channel('dev-states-broadcast')
      .on('broadcast', 
        { event: 'state_updated' }, 
        handleBroadcastUpdate
      )
      .subscribe((status) => {
        console.log('[DevStatesContext] Broadcast subscription status:', status);
      });

    subscriptionRef.current = dbSubscription;
    broadcastChannelRef.current = broadcastSubscription;

    return () => {
      console.log('[DevStatesContext] Cleaning up subscriptions...');
      isUnmountedRef.current = true;
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.unsubscribe();
        broadcastChannelRef.current = null;
      }
    };
  }, [fetchAllStates, handleDatabaseChange, handleBroadcastUpdate]);

  return (
    <DevStatesContext.Provider value={{
      allUserStates,
      updateUserState,
      loading,
      refetch: fetchAllStates
    }}>
      {children}
    </DevStatesContext.Provider>
  );
}

export function useDevStatesContext() {
  const context = useContext(DevStatesContext);
  if (!context) {
    throw new Error('useDevStatesContext must be used within DevStatesProvider');
  }
  return context;
}