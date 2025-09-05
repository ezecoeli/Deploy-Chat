import { useState, useEffect } from 'react';
import { LanguageProvider } from './hooks/useTranslation';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Chat from './components/Chat';
import UpdatePassword from './components/UpdatePassword';

function AppContent() {
  const { user, loading } = useAuth();
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  // 🔍 DEBUG: Log del estado actual
  console.log('🎭 AppContent render - user:', user?.email || 'null', 'loading:', loading);

  // detectar password recovery del localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const type = urlParams.get('type');
    
    if (type === 'recovery' && accessToken) {
      console.log('🔑 Password recovery detected from URL');
      setIsPasswordReset(true);
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Loading state mientras se inicializa la auth
  if (loading) {
    console.log('⏳ Mostrando pantalla de loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (isPasswordReset && user) {
    console.log('🔑 Mostrando UpdatePassword...');
    return <UpdatePassword onPasswordUpdated={() => setIsPasswordReset(false)} />;
  }

  if (!user) {
    console.log('🚪 Mostrando Login...');
    return <Login />;
  }

  console.log('💬 Mostrando Chat...');
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