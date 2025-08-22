import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from './LanguageToggle';
import banner from '../assets/banner-black.png';

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
    <div className="flex flex-col lg:flex-row items-center justify-center w-full gap-8 px-4">
      {/* Banner Image */}
      <div className="w-full lg:w-auto p-4">
        <img 
          src={banner} 
          alt="Login Banner" 
          className="max-h-[400px] lg:max-h-[600px] object-contain mx-auto"
        />
      </div>

      {/* Login Form Container */}
      <div className="w-[320px] sm:w-96 p-4 relative overflow-hidden z-0 login-border rounded-lg">
        <div className="relative z-10 bg-black p-6 rounded-lg">
          {/* Dropdown */}
          <div className="flex justify-end mb-4">
            <LanguageToggle />
          </div>

          <h2 className="text-2xl font-bold mb-8 text-center text-gray-200">
            {t('login')} / {t('register')}
          </h2>

          <form className="flex flex-col gap-4 text-gray-100">
            <input
              type="email"
              placeholder={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="password"
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={handleLogin}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-gray-500 text-white font-medium rounded-md transition-colors duration-200"
              >
                {t('confirmLogin')}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-md transition-colors duration-200"
              >
                {t('confirmRegister')}
              </button>
            </div>
          </form>

          {message && (
            <p className="mt-4 text-center text-sm text-gray-700">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
