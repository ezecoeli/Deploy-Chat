import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { handleUserSession } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastAuthEventTime, setLastAuthEventTime] = useState(0);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const authFlow = sessionStorage.getItem('auth_flow_active');
        
        // if it's recovery flow, clear user and loading
        if (authFlow === 'recovery') {
          setUser(null);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        // if it's login flow, set session from stored tokens
        if (authFlow === 'login') {
          const accessToken = sessionStorage.getItem('auth_login_access_token');
          const refreshToken = sessionStorage.getItem('auth_login_refresh_token');
          
          if (accessToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (!error && data.user && mounted) {
              setUser(data.user);
              
              try {
                await handleUserSession(data);
              } catch (handleSessionError) {
                // Error in handleUserSession, but continue
              }
            }

            // Clear login tokens
            sessionStorage.removeItem('auth_login_access_token');
            sessionStorage.removeItem('auth_login_refresh_token');
            sessionStorage.removeItem('auth_flow_active');
          }
        } else {
          // Normal flow: check existing session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (!error && session?.user && mounted) {
            setUser(session.user);
            
            try {
              await handleUserSession(session);
            } catch (handleSessionError) {
              // Error in handleUserSession, but continue
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        // inicialization failed, but continue
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // changes auth listener (eg. sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const now = Date.now();

        // Debounce: ignore very frequent events (less than 1 second)
        if (now - lastAuthEventTime < 1000 && event === 'SIGNED_IN') {
          return;
        }
        
        setLastAuthEventTime(now);

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setLoading(false);
          
          handleUserSession(session).catch(error => {
            // Error in handleUserSession, but continue
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Delay to ensure main.jsx has finished processing
    const timer = setTimeout(initializeAuth, 100);

    return () => {
      clearTimeout(timer);
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      if (user) {
        await supabase
          .from('users')
          .update({ status: 'offline' })
          .eq('id', user.id);
      }

      // Clear auth tokens
      sessionStorage.removeItem('auth_flow_active');
      sessionStorage.removeItem('auth_recovery_access_token');
      sessionStorage.removeItem('auth_recovery_refresh_token');
      sessionStorage.removeItem('auth_recovery_code');
      sessionStorage.removeItem('auth_recovery_type');
      sessionStorage.removeItem('auth_login_access_token');
      sessionStorage.removeItem('auth_login_refresh_token');

      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
      }
    } catch (error) {
      // logout failed, but clear user anyway
      setUser(null);
    }
  };

  const value = { user, loading, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};