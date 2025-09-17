import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export function usePinnedMessages(channelId) {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPinnedMessages = useCallback(async () => {
    if (!channelId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          pinned_at,
          pinned_by,
          users:user_id (
            id,
            email,
            username,
            avatar_url
          ),
          pinned_by_user:pinned_by (
            id,
            email,
            username
          )
        `)
        .eq('channel_id', channelId)
        .eq('is_pinned', true)
        .order('pinned_at', { ascending: false })
        .limit(2);

      if (!error) {
        setPinnedMessages(data || []);
      }
    } catch (error) {
      console.error('Error loading pinned messages:', error);
    }
  }, [channelId]);

  const pinMessage = useCallback(async (messageId, userId) => {
    if (!messageId || !userId || !channelId) return false;

    try {
      setLoading(true);

      const currentPinnedCount = pinnedMessages.length;
      if (currentPinnedCount >= 2) {
        throw new Error('Maximum 2 pinned messages allowed per channel');
      }

      const { error } = await supabase
        .from('messages')
        .update({
          is_pinned: true,
          pinned_at: new Date().toISOString(),
          pinned_by: userId
        })
        .eq('id', messageId)
        .eq('channel_id', channelId);

      if (error) throw error;

      await loadPinnedMessages();
      return true;
    } catch (error) {
      console.error('Error pinning message:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [channelId, pinnedMessages.length, loadPinnedMessages]);

  const unpinMessage = useCallback(async (messageId) => {
    if (!messageId) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('messages')
        .update({
          is_pinned: false,
          pinned_at: null,
          pinned_by: null
        })
        .eq('id', messageId);

      if (error) throw error;

      await loadPinnedMessages();
      return true;
    } catch (error) {
      console.error('Error unpinning message:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadPinnedMessages]);

  useEffect(() => {
    loadPinnedMessages();
  }, [loadPinnedMessages]);

  useEffect(() => {
    if (!channelId) return;

    const subscription = supabase
      .channel(`pinned_messages_${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        if (payload.new?.is_pinned !== undefined || payload.old?.is_pinned !== undefined) {
          loadPinnedMessages();
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelId, loadPinnedMessages]);

  return {
    pinnedMessages,
    loading,
    pinMessage,
    unpinMessage,
    canPinMore: pinnedMessages.length < 2
  };
}