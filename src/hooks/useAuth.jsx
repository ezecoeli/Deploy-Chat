import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { handleUserSession } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    console.log('useAuth useEffect iniciado');

    const initializeAuth = async () => {
      try {
        console.log('Inicializando autenticación...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user && mounted) {
          console.log('Sesión existente encontrada:', session.user.email);
          setUser(session.user);
          
          try {
            await handleUserSession(session);
            console.log('handleUserSession completado en initializeAuth');
          } catch (handleSessionError) {
            console.error('Error en handleUserSession (initializeAuth):', handleSessionError);
            // Continúa aunque handleUserSession falle
          }
        } else {
          console.log('No hay sesión existente');
          setUser(null);
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
      } finally {
        if (mounted) {
          console.log('initializeAuth finally - setting loading = false');
          setLoading(false);
        } else {
          console.log('Component unmounted, not setting loading = false');
        }
      }
    };

    // Listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('onAuthStateChange triggered:', event, 'mounted:', mounted);
        
        if (!mounted) {
          console.log('Component unmounted, skipping auth change');
          return;
        }

        console.log('Auth state changed:', event);
        
        try {
          if (session?.user) {
            console.log('Usuario autenticado:', session.user.email);
            setUser(session.user);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              console.log('Ejecutando handleUserSession...');
              
              try {
                // timeout 
                const sessionPromise = handleUserSession(session);
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('handleUserSession timeout en useAuth')), 8000)
                );
                
                await Promise.race([sessionPromise, timeoutPromise]);
                console.log('handleUserSession completado en onChange');
              } catch (handleSessionError) {
                console.error('Error en handleUserSession (onChange):', handleSessionError.message);
                // Continúa aunque handleUserSession falle
              }
            }
          } else {
            console.log('Usuario desautenticado');
            setUser(null);
          }
        } catch (error) {
          console.error('Error handling auth change:', error);
        }
        
        // SIEMPRE setear loading a false, sin importar errores
        console.log('Antes de setear loading = false, mounted:', mounted);
        if (mounted) {
          console.log('Auth change procesado, loading = false');
          setLoading(false);
        } else {
          console.log('Component unmounted, not setting loading = false in onChange');
        }
      }
    );

    console.log('Subscription creada, iniciando auth...');
    
    // Inicializar
    initializeAuth();

    // Cleanup
    return () => {
      console.log('🧹 useAuth cleanup - unmounting');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      console.log('🚪 Iniciando logout...');
      
      if (user) {
        await supabase
          .from('users')
          .update({ status: 'offline' })
          .eq('id', user.id);
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during logout:', error);
      } else {
        setUser(null);
        console.log('Logout exitoso');
      }
    } catch (error) {
      console.error('Error in logout:', error);
    }
  };

  // Debug del estado actual
  console.log('useAuth render - user:', user?.email || 'null', 'loading:', loading);

  const value = {
    user,
    loading,
    logout
  };

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