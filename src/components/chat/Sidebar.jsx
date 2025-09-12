import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { BsFileLock, BsPlus, BsChatSquareText } from "react-icons/bs";
import { useTranslation } from '../../hooks/useTranslation';

export default function Sidebar({ 
  user, 
  onSelectConversation, 
  currentChannel,
  theme,
  currentTheme 
}) {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const isMountedRef = useRef(true);
  const loadingTimeoutRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!user?.id) return;

    // avoid reloading if conversations already loaded
    if (conversations.length > 0) return;

    const loadDataOnce = async () => {
      try {
        await Promise.all([
          loadDirectConversations(),
          loadAllUsers()
        ]);
      } catch (error) {
        console.error('Error loading DirectMessages data:', error);
      }
    };

    loadDataOnce();
  }, [user?.id]); 

  const loadData = async () => {
    if (!isMountedRef.current) return;
    
    try {
      await Promise.all([
        loadDirectConversations(),
        loadAllUsers()
      ]);
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error loading DirectMessages data:', error);
      }
    }
  };

  // Load user's direct conversations
  const loadDirectConversations = async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      console.log('Loading direct conversations for user:', user.id);
      
      // Step 1: Get direct channels where user participates
      const { data: channels, error: channelsError } = await supabase
        .from('channels')
        .select('id, name, type, participant_1, participant_2, created_at, updated_at')
        .eq('type', 'direct')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (channelsError) throw channelsError;
      console.log('Found channels:', channels);

      if (!isMountedRef.current) return;

      if (!channels || channels.length === 0) {
        console.log('No direct channels found');
        setConversations([]);
        setLoading(false);
        return;
      }

      // Step 2: Get user data for all participants
      const userIds = new Set();
      channels.forEach(channel => {
        if (channel.participant_1) userIds.add(channel.participant_1);
        if (channel.participant_2) userIds.add(channel.participant_2);
      });

      const { data: userData, error: usersError } = await supabase
        .from('users')
        .select('id, email, username, avatar_url')
        .in('id', Array.from(userIds));

      if (usersError) {
        console.warn('Could not load user data:', usersError);
      }

      if (!isMountedRef.current) return;

      // Step 3: Combine channel and user data with better fallback
      const conversationsWithUsers = channels.map(channel => {
        const otherUserId = channel.participant_1 === user.id 
          ? channel.participant_2 
          : channel.participant_1;
        
        const otherUser = userData?.find(u => u.id === otherUserId) || {
          id: otherUserId,
          username: 'Unknown User',
          email: 'unknown@example.com',
          avatar_url: 'avatar-01'
        };

        return {
          ...channel,
          otherUser,
          name: otherUser.username || otherUser.email?.split('@')[0] || 'Unknown User'
        };
      });

      console.log('Final conversations:', conversationsWithUsers);
      setConversations(conversationsWithUsers);

    } catch (error) {
      console.error('Error loading direct conversations:', error);
      if (isMountedRef.current) {
        setConversations([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loadAllUsers = async () => {
    if (!isMountedRef.current) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, username, avatar_url')
        .neq('id', user.id)
        .order('email');

      if (error) throw error;
      
      if (isMountedRef.current) {
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  // Start new direct conversation
  const startDirectMessage = async (otherUser) => {
    try {
      setLoading(true);
      
      // Use RPC function to get or create direct channel
      const { data: channelId, error: rpcError } = await supabase
        .rpc('get_or_create_direct_channel', { 
          other_user_id: otherUser.id 
        });

      if (rpcError) throw rpcError;

      // Get the complete channel data
      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (channelError) throw channelError;

      // Create conversation object with user data
      const conversation = {
        ...channelData,
        otherUser: otherUser,
        name: otherUser.username || otherUser.email?.split('@')[0] || 'Unknown User'
      };

      // Select this conversation
      onSelectConversation(conversation);
      setShowUserSelector(false);
      
      // Reload conversations with delay to ensure creation is complete
      setTimeout(() => {
        if (isMountedRef.current) {
          loadDirectConversations();
        }
      }, 500);

    } catch (error) {
      console.error('Error starting direct message:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Get name of the other participant
  const getOtherParticipant = (conversation) => {
    if (!conversation.participant_1 || !conversation.participant_2) return 'Unknown';
    
    // Use user data if available
    if (conversation.otherUser) {
      return conversation.otherUser.username || conversation.otherUser.email?.split('@')[0] || 'Unknown User';
    }
    
    // Fallback: find other user ID
    const otherUserId = conversation.participant_1 === user.id 
      ? conversation.participant_2 
      : conversation.participant_1;
    
    return 'Unknown User';
  };

  // Get theme styles
  const getThemeStyles = () => {
    switch (currentTheme) {
      case 'matrix':
        return {
          container: 'text-green-400',
          item: 'hover:bg-green-500/30 text-green-300 border-green-500/20',
          activeItem: 'bg-green-500/40 text-green-200 border-green-400',
          button: 'text-green-300 hover:text-green-200 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30'
        };
      case 'coolRetro':
        return {
          container: 'text-cyan-400',
          item: 'hover:bg-cyan-400/30 text-cyan-300 border-cyan-400/20',
          activeItem: 'bg-cyan-400/40 text-cyan-200 border-cyan-300',
          button: 'text-cyan-300 hover:text-cyan-200 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/30'
        };
      case 'windows95':
        return {
          container: 'text-black',
          item: 'hover:bg-blue-600 hover:text-white text-black border-gray-300',
          activeItem: 'bg-blue-600 text-white border-blue-700',
          button: 'text-black hover:bg-gray-300 bg-white border border-gray-400 shadow-sm'
        };
      case 'ubuntu':
        return {
          container: 'text-orange-200',
          item: 'hover:bg-orange-500/30 text-orange-200 border-orange-400/20',
          activeItem: 'bg-orange-500/40 text-orange-100 border-orange-300',
          button: 'text-orange-300 hover:text-orange-200 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/30'
        };
      case 'macOS':
        return {
          container: 'text-white',
          item: 'hover:bg-blue-500/30 text-white border-gray-600',
          activeItem: 'bg-blue-500/40 text-blue-100 border-blue-400',
          button: 'text-blue-300 hover:text-blue-200 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30'
        };
      default:
        return {
          container: 'text-white',
          item: 'hover:bg-gray-600 text-gray-200 border-gray-600',
          activeItem: 'bg-blue-600 text-white border-blue-500',
          button: 'text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 border border-gray-500'
        };
    }
  };

  const themeStyles = getThemeStyles();

  // Real-time subscription with cleanup
  useEffect(() => {
    if (!user?.id) return;

    const channelSubscription = supabase
      .channel('direct_channels_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channels',
        filter: `type=eq.direct`
      }, (payload) => {
        if (isMountedRef.current && (
          payload.new?.participant_1 === user.id || 
          payload.new?.participant_2 === user.id ||
          payload.old?.participant_1 === user.id || 
          payload.old?.participant_2 === user.id
        )) {
          setTimeout(() => {
            if (isMountedRef.current) {
              loadDirectConversations();
            }
          }, 100);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelSubscription);
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-8 bg-gray-600 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header with button for DM */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wide opacity-70">
          {t('directMessages')}
        </h3>
        <button 
          onClick={() => setShowUserSelector(!showUserSelector)}
          className={`text-lg leading-none px-2 py-1 rounded ${themeStyles.button}`}
          title="Start new DM"
        >
          <BsPlus className='w-4 h-4' />
        </button>
      </div>

      {/* User selector */}
      {showUserSelector && (
        <div className="mb-4 p-2 rounded border" style={{ borderColor: theme.colors.border }}>
          <p className="text-xs opacity-70 mb-2">{t('selectUserToChat')}:</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {users.map(targetUser => (
              <button
                key={targetUser.id}
                onClick={() => startDirectMessage(targetUser)}
                className={`w-full text-left px-2 py-1 rounded text-sm ${themeStyles.item}`}
              >
                {targetUser.username || targetUser.email}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversations list */}
      <div className="space-y-1">
        {conversations.length === 0 ? (
          <p className="text-sm opacity-50 text-center py-4">
            {t('noDirectMessages')}
          </p>
        ) : (
          conversations.map(conversation => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`flex border items-center gap-2 px-2 py-2 rounded cursor-pointer transition-colors text-sm ${
                currentChannel?.id === conversation.id ? themeStyles.activeItem : themeStyles.item
              }`}
            >
              <span className="text-xs opacity-70"><BsChatSquareText className='w-5 h-5' /></span>
              <span className="truncate">
                {getOtherParticipant(conversation)}
              </span>
              <span className="text-xs opacity-50 ml-auto"><BsFileLock className='w-6 h-6' /></span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}