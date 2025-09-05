import { useState, useEffect } from 'react';
import { supabase } from './utils/supabaseClient';
import { LanguageProvider } from './hooks/useTranslation';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Chat from './components/Chat';
import UpdatePassword from './components/UpdatePassword';

function AppContent() {
  const { user } = useAuth();
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    // Detectar si el usuario viene de un enlace de reset de contraseña
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      
      // Si 'PASSWORD_RECOVERY' mostrar la pantalla de cambio de contraseña
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Password recovery detected');
        setIsPasswordReset(true);
      }
      
      // Si el usuario se loguea normalmente, resetear el estado
      if (event === 'SIGNED_IN' && !isPasswordReset) {
        setIsPasswordReset(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isPasswordReset]);

  // proceso de reset de contraseña, mostrar UpdatePassword
  if (isPasswordReset && user) {
    return <UpdatePassword onPasswordUpdated={() => setIsPasswordReset(false)} />;
  }

  // Si no hay usuario mostrar Login
  if (!user) {
    return <Login />;
  }

  // Si hay usuario y no está en reset, mostrar Chat
  return <Chat />;
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;