import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export function usePermissions(user) {
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setUserRole('user');
      setLoading(false);
      return;
    }

    const loadUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserRole(data?.role || 'user');
      } catch (error) {
        console.error('Error loading user role:', error);
        setUserRole('user');
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [user?.id]);

  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator' || userRole === 'admin';

  return {
    userRole,
    isAdmin,
    isModerator,
    loading
  };
}