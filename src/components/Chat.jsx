import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

export default function Chat() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="w-full max-w-4xl h-screen p-4 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <img 
            src={user?.user_metadata?.avatar_url || 'https://via.placeholder.com/40'} 
            alt="avatar" 
            className="w-10 h-10 rounded-full"
          />
          <span className="text-white">{user?.email}</span>
        </div>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {t('logout')}
        </button>
      </header>

      {/* Chat Container */}
      <div className="flex-1 bg-gray-800 rounded-lg p-4">
        <p className="text-white text-center">Chat próximamente...</p>
      </div>
    </div>
  );
}