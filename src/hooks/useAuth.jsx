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
    console.log('useAuth: useEffect iniciado');

    const initializeAuth = async () => {
      try {
        const authFlow = sessionStorage.getItem('auth_flow_active');
        
        console.log('useAuth: Verificando flujo de auth:', authFlow);
        
        // Si es recovery, NO inicializar sesión automática
        if (authFlow === 'recovery') {
          console.log('useAuth: Recovery flow activo, manteniendo user = null');
          setUser(null);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        // Si hay tokens de login pendientes, establecer sesión
        if (authFlow === 'login') {
          const accessToken = sessionStorage.getItem('auth_login_access_token');
          const refreshToken = sessionStorage.getItem('auth_login_refresh_token');
          
          if (accessToken) {
            console.log('useAuth: Estableciendo sesión con tokens de login');
            
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (error) {
              console.error('useAuth: Error estableciendo sesión de login:', error);
            } else if (data.user && mounted) {
              console.log('useAuth: Sesión de login establecida:', data.user.email);
              setUser(data.user);
              
              try {
                await handleUserSession(data);
              } catch (handleSessionError) {
                console.error('useAuth: Error en handleUserSession:', handleSessionError);
              }
            }
            
            // Limpiar tokens de login
            sessionStorage.removeItem('auth_login_access_token');
            sessionStorage.removeItem('auth_login_refresh_token');
            sessionStorage.removeItem('auth_flow_active');
          }
        } else {
          // Flujo normal: verificar sesión existente
          console.log('useAuth: Verificando sesión existente...');
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('useAuth: Error getting session:', error);
          } else if (session?.user && mounted) {
            console.log('useAuth: Sesión existente encontrada:', session.user.email);
            setUser(session.user);
            
            try {
              await handleUserSession(session);
            } catch (handleSessionError) {
              console.error('useAuth: Error en handleUserSession:', handleSessionError);
            }
          } else {
            console.log('useAuth: No hay sesión existente');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('useAuth: Error in initializeAuth:', error);
      } finally {
        if (mounted) {
          console.log('useAuth: Inicialización completa, loading = false');
          setLoading(false);
        }
      }
    };

    // Listener de cambios de auth (solo para eventos manuales)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const now = Date.now();
        
        // Debounce: ignorar eventos muy frecuentes (menos de 1 segundo)
        if (now - lastAuthEventTime < 1000 && event === 'SIGNED_IN') {
          console.log('useAuth: Evento SIGNED_IN ignorado por debounce');
          return;
        }
        
        setLastAuthEventTime(now);
        console.log('useAuth: onAuthStateChange:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('useAuth: Usuario autenticado via onChange:', session.user.email);
          setUser(session.user);
          setLoading(false);
          
          console.log('useAuth: Ejecutando handleUserSession...');
          handleUserSession(session).catch(error => {
            console.error('useAuth: Error en handleUserSession:', error);
          });
        } else if (event === 'SIGNED_OUT') {
          console.log('useAuth: Usuario desautenticado');
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Delay para asegurar que main.jsx terminó de procesar
    const timer = setTimeout(initializeAuth, 100);

    return () => {
      clearTimeout(timer);
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      console.log('useAuth: Iniciando logout...');
      
      if (user) {
        await supabase
          .from('users')
          .update({ status: 'offline' })
          .eq('id', user.id);
      }

      // Limpiar los tokens de auth
      sessionStorage.removeItem('auth_flow_active');
      sessionStorage.removeItem('auth_recovery_access_token');
      sessionStorage.removeItem('auth_recovery_refresh_token');
      sessionStorage.removeItem('auth_recovery_code');
      sessionStorage.removeItem('auth_recovery_type');
      sessionStorage.removeItem('auth_login_access_token');
      sessionStorage.removeItem('auth_login_refresh_token');

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('useAuth: Error during logout:', error);
      } else {
        setUser(null);
        console.log('useAuth: Logout exitoso');
      }
    } catch (error) {
      console.error('useAuth: Error in logout:', error);
    }
  };

  console.log('useAuth: render - user:', user?.email || 'null', 'loading:', loading);

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