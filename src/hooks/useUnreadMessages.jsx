import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useUnreadMessages(user) {
  const [unreadChannels, setUnreadChannels] = useState(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`unreadChannels_${user.id}`);
      if (stored) {
        try {
          setUnreadChannels(new Set(JSON.parse(stored)));
        } catch (error) {
          console.error('Error loading unread channels from localStorage:', error);
          setUnreadChannels(new Set());
        }
      }
    }
  }, [user?.id]);

  // Save to localStorage when changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`unreadChannels_${user.id}`, JSON.stringify([...unreadChannels]));
    }
  }, [unreadChannels, user?.id]);

  // Load unread channels for all user's channels
  const initializeUnreadChannels = useCallback(async () => {
    if (!user?.id || isInitialized) return;

    try {
      // Get all channels (public and direct) that the user participates in
      const { data: publicChannels } = await supabase
        .from('channels')
        .select('id, name, type')
        .eq('type', 'public')
        .eq('is_active', true)
        .eq('is_archived', false);

      const { data: directChannels } = await supabase
        .from('channels')
        .select('id, name, type, participant_1, participant_2')
        .eq('type', 'direct')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);

      const allChannels = [...(publicChannels || []), ...(directChannels || [])];

      if (allChannels.length > 0) {
        await checkUnreadForChannels(allChannels);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing unread channels:', error);
      setIsInitialized(true);
    }
  }, [user?.id, isInitialized]);

  // Automatically trigger initialization
  useEffect(() => {
    if (user?.id && !isInitialized) {
      initializeUnreadChannels();
    }
  }, [user?.id, isInitialized, initializeUnreadChannels]);

  // Check unread messages for specific channels
  const checkUnreadForChannels = useCallback(async (channels) => {
    if (!user?.id || !channels?.length) return;

    try {
      const newUnread = new Set();

      // Get last read times for user
      const { data: reads } = await supabase
        .from('user_channel_reads')
        .select('channel_id, last_read_at')
        .eq('user_id', user.id);

      // Check each channel for unread messages (excluding user's own messages)
      for (const channel of channels) {
        const read = reads?.find(r => r.channel_id === channel.id);
        const lastReadTime = read?.last_read_at || '1970-01-01';
        
        const { data: messages } = await supabase
          .from('messages')
          .select('id, created_at, user_id')
          .eq('channel_id', channel.id)
          .gt('created_at', lastReadTime)
          .neq('user_id', user.id) // EXCLUDE user's own messages
          .limit(1); 
          
        if (messages && messages.length > 0) {
          newUnread.add(channel.id);
        }
      }

      setUnreadChannels(prev => {
        const combined = new Set([...prev, ...newUnread]);
        return combined;
      });

    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  }, [user?.id]);

  // Mark channel as read
  const markChannelAsRead = useCallback(async (channelId) => {
    if (!user?.id || !channelId) return;

    try {
      await supabase
        .from('user_channel_reads')
        .upsert({
          user_id: user.id,
          channel_id: channelId,
          last_read_at: new Date().toISOString()
        }, { onConflict: ['user_id', 'channel_id'] });

      // Remove from local state
      setUnreadChannels(prev => {
        const newSet = new Set(prev);
        newSet.delete(channelId);
        return newSet;
      });

    } catch (error) {
      console.error('Error marking channel as read:', error);
    }
  }, [user?.id]);

  // Add channel to unread (only for messages from other users)
  const addUnreadChannel = useCallback((channelId, messageUserId) => {
    if (!channelId || !messageUserId || messageUserId === user?.id) return;
    
    setUnreadChannels(prev => new Set([...prev, channelId]));
  }, [user?.id]);

  // Remove channel from unread 
  const removeUnreadChannel = useCallback((channelId) => {
    if (!channelId) return;
    
    setUnreadChannels(prev => {
      const newSet = new Set(prev);
      newSet.delete(channelId);
      return newSet;
    });
  }, []);

  // Clean up all unread channels
  const clearAllUnread = useCallback(() => {
    setUnreadChannels(new Set());
  }, []);

  return {
    unreadChannels,
    checkUnreadForChannels,
    markChannelAsRead,
    addUnreadChannel,
    removeUnreadChannel,
    clearAllUnread,
    isInitialized
  };
}