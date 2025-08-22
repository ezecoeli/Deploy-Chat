import { supabase } from './supabaseClient';

export const handleUserSession = async (session) => {
  if (session?.user) {
    const { id, email, user_metadata } = session.user;
    
    const { error } = await supabase
      .from('users')
      .upsert({
        id,
        email,
        username: user_metadata.name || email.split('@')[0],
        avatar_url: user_metadata.avatar_url,
        status: 'online'
      });

    if (error) console.error('Error updating user:', error);
  }
};