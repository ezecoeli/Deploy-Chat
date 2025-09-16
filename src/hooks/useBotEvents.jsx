import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useBotEvents(channelId) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  // List events by channel
  const getEventsByChannel = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('bot_events')
      .select('*')
      .eq('channel_id', channelId)
      .order('next_execution', { ascending: true });
    setEvents(data || []);
    setError(error);
    setIsLoading(false);
  };

  // Create event
  const createEvent = async (eventData) => {
    setIsCreating(true);
    const { error } = await supabase
      .from('bot_events')
      .insert([eventData]);
    setIsCreating(false);
    setError(error);
    if (!error) getEventsByChannel();
    return !error;
  };

  // Edit event
  const updateEvent = async (id, eventData) => {
    const { error } = await supabase
      .from('bot_events')
      .update(eventData)
      .eq('id', id);
    setError(error);
    if (!error) getEventsByChannel();
    return !error;
  };

  // delete event
  const deleteEvent = async (id) => {
    const { error } = await supabase
      .from('bot_events')
      .delete()
      .eq('id', id);
    setError(error);
    if (!error) getEventsByChannel();
    return !error;
  };

  // on/off event
  const toggleEventStatus = async (id, isActive) => {
    const { error } = await supabase
      .from('bot_events')
      .update({ is_active: isActive })
      .eq('id', id);
    setError(error);
    if (!error) getEventsByChannel();
    return !error;
  };

  useEffect(() => {
    if (channelId) getEventsByChannel();
    // eslint-disable-next-line
  }, [channelId]);

  return {
    events,
    isLoading,
    isCreating,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsByChannel,
    toggleEventStatus,
  };
}