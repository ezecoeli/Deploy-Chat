import { useState, useEffect } from 'react';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { PiWarningCircleFill } from "react-icons/pi";
import { supabase } from '../utils/supabaseClient';
import { useTranslation } from '../hooks/useTranslation';
import { handleUserSession } from '../utils/auth';
import LanguageToggle from './LanguageToggle';
import PasswordReset from './PasswordReset';
import banner from '../assets/banner-transp.png';
import loginBackground from '../assets/login-bg.png';

export default function Login() {
  const { t } = useTranslation();
  
  // los hooks
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    password: false
  });

  // funciones
  const clearFieldError = (fieldName) => {
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: false
    }));
    if (message) setMessage('');
  };

  const setFieldError = (fieldName, errorMessage) => {
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: true
    }));
    setMessage(errorMessage);
  };

  const clearAllErrors = () => {
    setFieldErrors({ email: false, password: false });
    setMessage('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    clearAllErrors();

    if (!email.trim()) {
      setFieldError('email', t('missingEmail'));
      return;
    }

    if (!password.trim()) {
      setFieldError('password', t('missingPassword'));
      return;
    }

    if (!email.includes('@')) {
      setFieldError('email', t('invalidEmail'));
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          setFieldErrors({ email: true, password: true });
          setMessage(t('invalidCredentials'));
        } else {
          setMessage(error.message);
        }
      } else {
        setMessage(`${t('welcome')} ${data.user.email}`);
      }
    } catch (err) {
      setMessage(t('unexpectedError'));
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    clearAllErrors();

    if (!email.trim()) {
      setFieldError('email', t('missingEmail'));
      return;
    }

    if (!password.trim()) {
      setFieldError('password', t('missingPassword'));
      return;
    }

    if (!email.includes('@')) {
      setFieldError('email', t('invalidEmail'));
      return;
    }

    if (password.length < 6) {
      setFieldError('password', t('passwordTooShort'));
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(t('checkEmail'));
      }
    } catch (err) {
      setMessage(t('unexpectedError'));
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        setMessage(`Error con ${provider}: ${error.message}`);
      }
    } catch (err) {
      setMessage(`Error inesperado con ${provider}`);
    }
  };

  if (showResetPassword) {
    return <PasswordReset onBackToLogin={() => setShowResetPassword(false)} />;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Fondo base oscuro */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800" />
      
      {/* Imagen de fondo con mayor opacidad y filtro */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${loginBackground})`,
          opacity: 0.15,
          filter: 'brightness(0.4) contrast(1.2) hue-rotate(200deg)' // Tonos azulados
        }}
      />
      
      {/* Overlay con gradiente radial centrado */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 70%)'
        }}
      />
      
      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-screen w-full gap-8 px-4">
        
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
          <div className="relative z-10 bg-black/90 backdrop-blur-sm p-6 rounded-lg">
            {/* language toggle */}
            <div className="flex justify-end mb-4">
              <LanguageToggle />
            </div>

            <h2 className="text-3xl font-bold mb-8 text-center text-gray-200">
              {t('login')} / {t('register')}
            </h2>

            <form 
              className="flex flex-col gap-4 text-gray-100"
              onSubmit={handleLogin}
            >
              <input
                id="email"
                name="email"
                type="email"
                placeholder={t('email')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                autoComplete="email"
                className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-base transition-colors text-gray-800 ${
                  fieldErrors.email 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-green-500'
                }`}
              />
              <input
                id="password"
                name="password"
                type="password"
                placeholder={t('password')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
                autoComplete="current-password"
                className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-base transition-colors text-gray-800 ${
                  fieldErrors.password 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-green-500'
                }`}
              />
              <div className="flex justify-between gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-700 hover:bg-gray-500 text-white font-medium rounded-md transition-colors duration-200 text-base"
                >
                  {t('confirmLogin')}
                </button>
                <button
                  type="button"
                  onClick={handleSignUp}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-md transition-colors duration-200 text-base"
                >
                  {t('confirmRegister')}
                </button>
              </div>
              
              {/* Forgot password link */}
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="text-md text-gray-300 font-bold hover:text-white hover:underline transition-colors text-center mt-2"
              >
                {t('forgotPassword')}
              </button>
            </form>

            {/* social login buttons */}
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => handleSocialLogin('google')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors duration-200 text-base"
              >
                <FaGoogle className="w-5 h-5" />
                {t('loginWithGoogle')}
              </button>

              <button
                onClick={() => handleSocialLogin('github')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#004d9f] hover:bg-gray-500 text-white font-medium rounded-md transition-colors duration-200 text-base"
              >
                <FaGithub className="w-5 h-5" />
                {t('loginWithGithub')}
              </button>
            </div>

            {message && (
              <div className="mt-4 flex items-center justify-center gap-2 text-red-400">
                <PiWarningCircleFill className="w-5 h-5" />
                <p className="text-center text-base">
                  {message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}