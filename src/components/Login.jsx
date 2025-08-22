import { useState, useEffect } from 'react';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { supabase } from '../utils/supabaseClient';
import { useTranslation } from '../hooks/useTranslation';
import { handleUserSession } from '../utils/auth';
import LanguageToggle from './LanguageToggle';
import banner from '../assets/banner-black.png';

export default function Login() {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        handleUserSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleSocialLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    if (error) setMessage(error.message);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message);
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
          {/* language toggle */}
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
                className="flex-1 px-4 py-2 bg-green-700 hover:bg-gray-500 text-white font-medium rounded-md transition-colors duration-200"
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

          {/* social login buttons */}
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              <FaGoogle className="w-5 h-5" />
              {t('loginWithGoogle')}
            </button>

            <button
              onClick={() => handleSocialLogin('github')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#004d9f] hover:bg-gray-500 text-white font-medium rounded-md transition-colors duration-200"
            >
              <FaGithub className="w-5 h-5" />
              {t('loginWithGithub')}
            </button>
          </div>

          {message && (
            <p className="mt-4 text-center text-sm text-gray-200">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
