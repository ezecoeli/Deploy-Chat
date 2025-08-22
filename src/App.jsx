import { LanguageProvider } from './hooks/useTranslation.jsx';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login.jsx';
import Chat from './components/Chat.jsx';
import { useAuth } from './context/AuthContext';

function AppContent() {
  const { user } = useAuth();
  
  return (
    <LanguageProvider>
      <div className="min-h-screen flex items-center justify-center bg-black relative">
        {user ? <Chat /> : <Login />}
      </div>
    </LanguageProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

