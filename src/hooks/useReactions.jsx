import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export const DEVELOPER_REACTIONS = {
  // classic reactions
  like: { emoji: '👍', label: 'Like', category: 'classic' },
  dislike: { emoji: '👎', label: 'Dislike', category: 'classic' },
  love: { emoji: '❤️', label: 'Love', category: 'classic' },
  laugh: { emoji: '😂', label: 'Laugh', category: 'classic' },
  cry: { emoji: '😢', label: 'Sad', category: 'classic' },
  wow: { emoji: '😮', label: 'Wow', category: 'classic' },
  angry: { emoji: '😡', label: 'Angry', category: 'classic' },
  thinking: { emoji: '🤔', label: 'Thinking', category: 'classic' },

  // modern reactions
  mind_blown: { emoji: '🤯', label: 'Mind Blown', category: 'modern' },
  party: { emoji: '🥳', label: 'Party', category: 'modern' },
  eyes: { emoji: '👀', label: 'Eyes', category: 'modern' },
  facepalm: { emoji: '🤦', label: 'Facepalm', category: 'modern' },
  fire: { emoji: '🔥', label: 'Fire', category: 'modern' },
  skull: { emoji: '💀', label: 'Dead', category: 'modern' },
  
  // gesture reactions
  clap: { emoji: '👏', label: 'Clap', category: 'gesture' },
  pray: { emoji: '🙏', label: 'Thanks', category: 'gesture' },
  strong: { emoji: '💪', label: 'Strong', category: 'gesture' },
  ok_hand: { emoji: '👌', label: 'OK', category: 'gesture' },
  wave: { emoji: '👋', label: 'Wave', category: 'gesture' },
  raised_hands: { emoji: '🙌', label: 'Praise', category: 'gesture' }
};

export const useReactions = (messageId, userId) => {
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchReactions = useCallback(async () => {
    if (!messageId || !mountedRef.current) return;

    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('emoji, user_id')
        .eq('message_id', messageId);

      if (error) throw error;

      if (!mountedRef.current) return;

      const groupedReactions = {};
      let currentUserReaction = null;

      data?.forEach(reaction => {
        if (!groupedReactions[reaction.emoji]) {
          groupedReactions[reaction.emoji] = [];
        }
        groupedReactions[reaction.emoji].push(reaction.user_id);
        
        if (reaction.user_id === userId) {
          currentUserReaction = reaction.emoji;
        }
      });

      setReactions(groupedReactions);
      setUserReaction(currentUserReaction);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  }, [messageId, userId]);

  useEffect(() => {
    if (!messageId) return;

    mountedRef.current = true;

    // Initial fetch
    fetchReactions();

    
    const channelName = `reactions:${messageId}`;
    
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: true, ack: false },
          presence: { key: userId }
        }
      })
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`
        }, 
        (payload) => {
          // Immediate refetch when database changes
          fetchReactions();
        }
      )
      .on('broadcast', 
        { event: 'reaction_update' }, 
        (payload) => {
          // Also listen to broadcast events for instant updates
          if (payload.payload.messageId === messageId) {
            fetchReactions();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Successfully subscribed to shared channel
        }
      });

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [messageId, userId, fetchReactions]);

  const toggleReaction = async (emoji) => {
    if (!userId || !messageId || loading) return;

    setLoading(true);

    try {
      if (userReaction === emoji) {
        // Remove existing reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', userId);

        if (error) throw error;
        
      } else {
        // For changing reactions delete first, then insert
        if (userReaction) {
          await supabase
            .from('message_reactions')
            .delete()
            .eq('message_id', messageId)
            .eq('user_id', userId);
        }

        // Then insert new reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: userId,
            emoji: emoji
          });

        if (error) throw error;
      }

      // Broadcast update to ALL users viewing this message
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'reaction_update',
          payload: { 
            messageId, 
            userId, 
            emoji: userReaction === emoji ? null : emoji,
            timestamp: Date.now()
          }
        });
      }

      // Also force local refresh
      fetchReactions();

    } catch (error) {
      console.error('Error toggling reaction:', error);
      fetchReactions();
    } finally {
      setLoading(false);
    }
  };

  const getTotalReactions = () => {
    return Object.values(reactions).reduce((total, users) => total + users.length, 0);
  };

  const getReactionCount = (emoji) => {
    return reactions[emoji]?.length || 0;
  };

  const hasUserReacted = (emoji) => {
    return userReaction === emoji;
  };

  return {
    reactions,
    userReaction,
    loading,
    toggleReaction,
    getTotalReactions,
    getReactionCount,
    hasUserReacted
  };
};