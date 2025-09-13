import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { BsLock, BsPlus, BsChatSquareText, BsArchive} from "react-icons/bs";
import { useTranslation } from '../../hooks/useTranslation';
import { usePermissions } from '../../hooks/usePermissions';
import { FaHashtag } from "react-icons/fa";
import ArchiveConfirmModal from '../ui/ArchiveConfirmModal';

export default function Sidebar({ 
  user, 
  onSelectConversation, 
  currentChannel,
  theme,
  currentTheme 
}) {
  const [conversations, setConversations] = useState([]);
  const [publicChannels, setPublicChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const { t } = useTranslation();
  const { isAdmin, loading: permissionsLoading } = usePermissions(user);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const userId = useMemo(() => user?.id, [user?.id]);

  const getChannelDisplayName = useCallback((channelName) => {
    const translationMap = {
      'announcements': t('announcements'),
      'general': t('general'),
      'daily-standups': t('dailyStandups'),
      'events': t('events'),
      'support': t('support'),
      'random': t('random')
    };
    
    return translationMap[channelName] || channelName;
  }, [t]);

  const getChannelDescription = useCallback((channelName, originalDescription) => {
    const translationMap = {
      'announcements': t('announcementsDescription'),
      'general': t('generalDescription'),
      'daily-standups': t('dailyStandupsDescription'),
      'events': t('eventsDescription'),
      'support': t('supportDescription'),
      'random': t('randomDescription')
    };
    
    return translationMap[channelName] || originalDescription;
  }, [t]);

  const getOtherParticipant = useCallback((conversation) => {
    if (!conversation.participant_1 || !conversation.participant_2) return 'Unknown';
    
    if (conversation.otherUser) {
      return conversation.otherUser.username || conversation.otherUser.email?.split('@')[0] || 'Unknown User';
    }
    
    return 'Unknown User';
  }, []);

  const loadPublicChannels = useCallback(async () => {
    if (loadingRef.current || !userId) return;
    
    try {
      setChannelsLoading(true);
      loadingRef.current = true;
      
      const { data, error } = await supabase
        .from('channels')
        .select('id, name, description, created_by, created_at, type, is_active, is_archived')
        .eq('type', 'public')
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setPublicChannels(data || []);
      
    } catch (error) {
      console.error('Failed to load public channels:', error);
      setPublicChannels([]);
    } finally {
      setChannelsLoading(false);
      loadingRef.current = false;
    }
  }, [userId]);

  const loadDirectConversations = useCallback(async () => {
    if (!userId) return;
    
    try {
      setConversationsLoading(true);
      
      const { data: channels, error: channelsError } = await supabase
        .from('channels')
        .select('id, name, type, participant_1, participant_2, created_at, updated_at')
        .eq('type', 'direct')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (channelsError) throw channelsError;

      if (!channels || channels.length === 0) {
        setConversations([]);
        return;
      }

      const userIds = new Set();
      channels.forEach(channel => {
        if (channel.participant_1) userIds.add(channel.participant_1);
        if (channel.participant_2) userIds.add(channel.participant_2);
      });

      const { data: userData } = await supabase
        .from('users')
        .select('id, email, username, avatar_url')
        .in('id', Array.from(userIds));

      const conversationsWithUsers = channels.map(channel => {
        const otherUserId = channel.participant_1 === userId 
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

      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error('Error loading direct conversations:', error);
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  }, [userId]);

  const loadAllUsers = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, username, avatar_url')
        .neq('id', userId)
        .order('email');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, [userId]);

  const handleArchiveChannel = useCallback(async (channelId, channelName) => {
    if (['general', 'announcements'].includes(channelName)) {
      setConfirmModal({
        isOpen: true,
        title: t('cannotArchiveGeneral'),
        message: `El canal ${getChannelDisplayName(channelName)} no puede ser archivado.`,
        onConfirm: () => {}
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: t('archiveChannel'),
      message: t('confirmArchive'),
      onConfirm: async () => {
        try {
          const { error: rpcError } = await supabase
            .rpc('archive_public_channel', {
              channel_id: channelId
            });

          if (rpcError) {
            console.log('RPC failed, trying direct update:', rpcError);
            
            const { error: updateError } = await supabase
              .from('channels')
              .update({ 
                is_archived: true,
                is_active: false,
                updated_at: new Date().toISOString()
              })
              .eq('id', channelId)
              .eq('type', 'public');

            if (updateError) throw updateError;
          }
          
          setPublicChannels(prev => prev.filter(channel => channel.id !== channelId));
          
          if (currentChannel?.id === channelId) {
            const generalChannel = publicChannels.find(ch => ch.name === 'general');
            if (generalChannel) {
              onSelectConversation(generalChannel);
            }
          }
          
          console.log(`Channel ${channelName} archived successfully`);
          
          setConfirmModal({
            isOpen: true,
            title: t('channelArchived'),
            message: `El canal #${getChannelDisplayName(channelName)} ha sido archivado exitosamente.`,
            onConfirm: () => {}
          });
          
        } catch (error) {
          console.error('Error archiving channel:', error);
          
          setConfirmModal({
            isOpen: true,
            title: t('unexpectedError'),
            message: `Error al archivar el canal: ${error.message}`,
            onConfirm: () => {}
          });
          
          await loadPublicChannels();
        }
      }
    });
  }, [currentChannel, publicChannels, onSelectConversation, loadPublicChannels, t, getChannelDisplayName]);

  useEffect(() => {
    if (!userId || isInitializedRef.current) return;
    
    console.log('Sidebar: Initial load for user:', userId);
    isInitializedRef.current = true;
    
    const loadData = async () => {
      await loadPublicChannels();
      await loadDirectConversations();
      await loadAllUsers();
    };
    
    loadData();
  }, [userId, loadPublicChannels, loadDirectConversations, loadAllUsers]);

  useEffect(() => {
    if (userId) {
      isInitializedRef.current = false;
    }
  }, [userId]);

  const startDirectMessage = useCallback(async (otherUser) => {
    try {
      const { data: channelId, error: rpcError } = await supabase
        .rpc('get_or_create_direct_channel', { 
          other_user_id: otherUser.id 
        });

      if (rpcError) throw rpcError;

      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (channelError) throw channelError;

      const conversation = {
        ...channelData,
        otherUser: otherUser,
        name: otherUser.username || otherUser.email?.split('@')[0] || 'Unknown User'
      };

      onSelectConversation(conversation);
      setShowUserSelector(false);
      
      setTimeout(() => loadDirectConversations(), 500);

    } catch (error) {
      console.error('Error starting direct message:', error);
    }
  }, [onSelectConversation, loadDirectConversations]);

  const handleCreateChannel = useCallback(async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('create_public_channel', {
          channel_name: newChannelName.trim(),
          channel_description: newChannelDescription.trim()
        });

      if (error) throw error;

      setNewChannelName('');
      setNewChannelDescription('');
      setShowCreateForm(false);
      
      await loadPublicChannels();
      
    } catch (error) {
      console.error('Error creating channel:', error);
      alert('Error creating channel: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [newChannelName, newChannelDescription, loadPublicChannels]);

  const closeConfirmModal = useCallback(() => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null
    });
  }, []);

  const themeStyles = useMemo(() => {
    switch (currentTheme) {
      case 'matrix':
        return {
          item: 'hover:bg-green-500/30 text-green-300 border-green-500/20',
          activeItem: 'bg-green-500/40 text-green-200 border-green-400',
          button: 'text-green-300 hover:text-green-200 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30'
        };
      case 'coolRetro':
        return {
          item: 'hover:bg-cyan-400/30 text-cyan-300 border-cyan-400/20',
          activeItem: 'bg-cyan-400/40 text-cyan-200 border-cyan-300',
          button: 'text-cyan-300 hover:text-cyan-200 bg-cyan-400/20 hover:bg-cyan-400/30 border border-cyan-400/30'
        };
      case 'windows95':
        return {
          item: 'hover:bg-blue-600 hover:text-white text-black border-gray-300',
          activeItem: 'bg-blue-600 text-white border-blue-700',
          button: 'text-black hover:bg-gray-300 bg-white border border-gray-400 shadow-sm'
        };
      case 'ubuntu':
        return {
          item: 'hover:bg-orange-500/30 text-orange-200 border-orange-400/20',
          activeItem: 'bg-orange-500/40 text-orange-100 border-orange-300',
          button: 'text-orange-300 hover:text-orange-200 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/30'
        };
      case 'macOS':
        return {
          item: 'hover:bg-gray-300 hover:text-black text-gray-800 border-gray-400/30',
          activeItem: 'bg-blue-500 text-white border-blue-600',
          button: 'text-gray-700 hover:text-black bg-gray-200 hover:bg-gray-300 border border-gray-400 shadow-sm'
        };
      default:
        return {
          item: 'hover:bg-gray-600 text-gray-200 border-gray-600',
          activeItem: 'bg-blue-600 text-white border-blue-500',
          button: 'text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 border border-gray-500'
        };
    }
  }, [currentTheme]);

  useEffect(() => {
    if (!userId) return;

    let subscription;
    let timeoutId;

    const setupSubscription = () => {
      subscription = supabase
        .channel(`sidebar_${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'channels'
        }, (payload) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            if (payload.new?.type === 'public' || payload.old?.type === 'public') {
              loadPublicChannels();
            }
            if (payload.new?.type === 'direct' || payload.old?.type === 'direct') {
              if (payload.new?.participant_1 === userId || 
                  payload.new?.participant_2 === userId ||
                  payload.old?.participant_1 === userId || 
                  payload.old?.participant_2 === userId) {
                loadDirectConversations();
              }
            }
          }, 500);
        })
        .subscribe();
    };

    setupSubscription();

    return () => {
      clearTimeout(timeoutId);
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [userId, loadPublicChannels, loadDirectConversations]);

  if (permissionsLoading) {
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
    <div className="flex flex-col h-full">
      <div className="p-3 border-b" style={{ borderColor: theme.colors.border }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wide opacity-70">
            {t('publicChannels')} ({publicChannels.length})
          </h3>
          {isAdmin && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className={`p-1.5 rounded transition-all ${themeStyles.button}`}
              title={t('createChannel')}
            >
              <BsPlus className="w-4 h-4" />
            </button>
          )}
        </div>

        {isAdmin && showCreateForm && (
          <form onSubmit={handleCreateChannel} className="space-y-2 mt-2 mb-3">
            <input
              type="text"
              placeholder={t('channelName')}
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              className="w-full px-2 py-1 rounded text-sm border bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              maxLength={50}
              required
            />
            <input
              type="text"
              placeholder={t('channelDescription')}
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
              className="w-full px-2 py-1 rounded text-sm border bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              maxLength={200}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !newChannelName.trim()}
                className="flex-1 px-2 py-1 disabled:opacity-50 rounded text-xs border bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
              >
                {loading ? t('saving') + '...' : t('createChannel')}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-2 py-1 rounded text-xs border bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-1">
          {channelsLoading ? (
            <div className="animate-pulse space-y-1">
              <div className="h-6 bg-gray-600 rounded"></div>
              <div className="h-6 bg-gray-600 rounded"></div>
            </div>
          ) : publicChannels.length === 0 ? (
            <p className="text-xs opacity-50 text-center py-2">
              No hay canales públicos
            </p>
          ) : (
            publicChannels.map(channel => (
              <div key={channel.id} className="flex items-center justify-between group">
                <div
                  onClick={() => onSelectConversation(channel)}
                  className={`flex-1 flex border items-center gap-2 px-2 py-2 rounded cursor-pointer transition-colors text-sm ${
                    currentChannel?.id === channel.id ? themeStyles.activeItem : themeStyles.item
                  }`}
                  title={getChannelDescription(channel.name, channel.description)}
                >
                  <FaHashtag className="w-4 h-4 opacity-70" />
                  <span className="truncate">{getChannelDisplayName(channel.name)}</span>
                </div>
                {isAdmin && channel.name !== 'general' && channel.name !== 'announcements' && (
                  <button
                    onClick={() => handleArchiveChannel(channel.id, channel.name)}
                    className="opacity-0 group-hover:opacity-70 hover:opacity-100 p-1 rounded ml-1"
                    style={{ color: theme.colors.error || '#ef4444' }}
                    title={`${t('archiveChannel')} #${getChannelDisplayName(channel.name)}`}
                  >
                    <BsArchive className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BsLock className="w-4 h-4 opacity-70" />
            <h3 className="text-xs font-bold uppercase tracking-wide opacity-70">
              {t('directMessages')} ({conversations.length})
            </h3>
          </div>
          <button 
            onClick={() => setShowUserSelector(!showUserSelector)}
            className={`text-lg leading-none px-2 py-1 rounded ${themeStyles.button}`}
            title="Nuevo DM"
          >
            <BsPlus className='w-3 h-3' />
          </button>
        </div>

        {showUserSelector && (
          <div className="mb-4 p-2 rounded border" style={{ borderColor: theme.colors.border }}>
            <p className="text-xs opacity-70 mb-2">{t('selectUserToChat')}</p>
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

        <div className="space-y-1">
          {conversationsLoading ? (
            <div className="animate-pulse space-y-1">
              <div className="h-8 bg-gray-600 rounded"></div>
              <div className="h-8 bg-gray-600 rounded"></div>
            </div>
          ) : conversations.length === 0 ? (
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
                <span className="text-xs opacity-50 ml-auto"></span>
              </div>
            ))
          )}
        </div>
      </div>
      <ArchiveConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        theme={theme}
        currentTheme={currentTheme}
        confirmText={t('confirm')}
        cancelText={t('cancel')}
      />
    </div>
  );
}