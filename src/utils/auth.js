import { supabase } from './supabaseClient';

export const handleUserSession = async (session) => {
  if (session?.user) {
    const { id, email, user_metadata } = session.user;
    
    console.log('Guardando usuario:', { id, email, user_metadata });
    
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id,
          email,
          username: user_metadata?.name || user_metadata?.full_name || email.split('@')[0],
          avatar_url: user_metadata?.avatar_url || `https://www.gravatar.com/avatar/${id}?d=identicon`,
          status: 'online'
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error updating user:', error);
        return false;
      } else {
        console.log('Usuario guardado exitosamente:', data);
        return true;
      }
    } catch (err) {
      console.error('Error en handleUserSession:', err);
      return false;
    }
  }
  return false;
};