import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useTranslation } from '../hooks/useTranslation';
import LanguageDropdown from './LanguageDropdown';

export default function Login() {
  const { t } = useTranslation(); // hook para traducciones

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setMessage(error.message);
    else setMessage(`Bienvenido ${data.user.email}`);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) setMessage(error.message);
    else setMessage(`Revisa tu correo para confirmar la cuenta`);
  };

  return (
    <div className="w-80 sm:w-96 mx-auto p-6 bg-transparent relative overflow-hidden z-0 login-border">
      
      <div className="relative z-10 bg-gray-100 dark:bg-gray-600 p-6 rounded-lg">
        {/* Dropdown */}
        <div className="flex justify-end mb-4">
          <LanguageDropdown />
        </div>

        <h2 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100">
          {t('login')} / {t('register')}
        </h2>
        <form className="flex flex-col gap-4">
          <input
            type="email"
            placeholder={t('email')} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
          />
          <input
            type="password"
            placeholder={t('password')} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
          />
          <div className="flex justify-between gap-3">
            <button 
              type="button" 
              onClick={handleLogin} 
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors duration-200"
            >
              {t('confirmLogin')}
            </button>
            <button 
              type="button" 
              onClick={handleSignUp} 
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors duration-200"
            >
              {t('confirmRegister')}
            </button>
          </div>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-700 dark:text-gray-300">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
