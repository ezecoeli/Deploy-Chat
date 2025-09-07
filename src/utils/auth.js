import { supabase } from './supabaseClient';

const pendingRequests = new Map();

export const handleUserSession = async (session) => {
  if (!session?.user) {
    return false;
  }

  const user = session.user;
  const userId = user.id;

  // Check if there's already a pending request for this user
  if (pendingRequests.has(userId)) {
    try {
      return await pendingRequests.get(userId);
    } catch (error) {
      pendingRequests.delete(userId);
      return false;
    }
  }

  // Create promise with timeout
  const userPromise = Promise.race([
    // Main request
    (async () => {
      try {
        // First check if the user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .eq('id', userId)
          .single();

        let userData;
        
        if (existingUser) {
          // User exists - only update basic fields, keep customizations
          userData = {
            id: userId,
            email: user.email,
            status: 'online'
            // DO NOT overwrite username or avatar_url
          };
        } else {
          // New user - use default values
          userData = {
            id: userId,
            email: user.email,
            username: user.user_metadata?.name || 
                     user.user_metadata?.full_name || 
                     user.email.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url || 
                       'avatar-01', // Use default avatar instead of Gravatar
            status: 'online'
          };
        }
        
        const { data, error } = await supabase
          .from('users')
          .upsert(userData, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (error) {
          throw error;
        }

        return true;

      } catch (error) {
        throw error;
      }
    })(),
    
    // Timeout
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: handleUserSession took more than 20 seconds')), 20000)
    )
  ]);

  // Save to cache
  pendingRequests.set(userId, userPromise);

  try {
    const result = await userPromise;
    return result;
  } catch (error) {
    return false;
  } finally {
    // Clean cache
    pendingRequests.delete(userId);
  }
};