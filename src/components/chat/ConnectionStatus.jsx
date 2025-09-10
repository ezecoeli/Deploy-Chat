import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { FiUsers } from 'react-icons/fi';

export default function ConnectionStatus({ 
  user, 
  theme, 
  t 
}) {
  const [memberCount, setMemberCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('online');

  // Load member function to get total users count
  const loadMemberCount = async () => {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      
      setMemberCount(count || 0);
    } catch (error) {
      setMemberCount(0);
    }
  };

  // Load member count on mount and user change
  useEffect(() => {
    if (user) {
      loadMemberCount();
    }
  }, [user]);

  // Subscribe to changes in the users table to update count in real-time
  useEffect(() => {
    if (!user) return;
    
    const userSubscription = supabase
      .channel('users_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, (payload) => {
        // Reload member count on any change
        loadMemberCount();
      })
      .subscribe();

    return () => {
      userSubscription.unsubscribe();
    };
  }, [user]);

  // Detect change in connection status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online');
    };
    
    const handleOffline = () => {
      setConnectionStatus('offline');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setConnectionStatus('away');
      } else if (navigator.onLine) {
        setConnectionStatus('online');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Function to get the visual connection status
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'online':
        return {
          color: 'bg-green-600',
          text: t('online') || 'En línea',
          textColor: 'text-green-600'
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          text: t('offline') || 'Desconectado',
          textColor: 'text-red-400'
        };
      case 'away':
        return {
          color: 'bg-yellow-500',
          text: 'Ausente',
          textColor: 'text-yellow-400'
        };
      default:
        return {
          color: 'bg-gray-500',
          text: 'Desconocido',
          textColor: 'text-gray-400'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="ml-2 mb-1 mt-1 flex items-center justify-between font-mono">
      <div className="flex items-center gap-2">
        <FiUsers className="w-4 h-4" style={{ color: theme.colors.accent }} />
        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
          {memberCount === 1 
            ? (t('oneMember') || '1 user online')
            : (t('membersCount')?.replace('{count}', memberCount) || `${memberCount} users online`)
          }
        </p>
      </div>
      
      {/* Status info */}
      <div className="mr-2 flex items-center gap-2">
        <div 
          className={`w-2 h-2 rounded-full ${statusInfo.color} ${
            connectionStatus === 'online' ? 'animate-pulse' : ''
          }`}
        />
        <span className={`text-sm ${statusInfo.textColor}`}>
          {statusInfo.text}
        </span>
      </div>
    </div>
  );
}