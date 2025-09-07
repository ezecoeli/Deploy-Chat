import { useState, useEffect } from 'react';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { PiWarningCircleFill } from "react-icons/pi";
import { supabase } from '../utils/supabaseClient';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from '../components/LanguageToggle';
import PasswordReset from '../components/PasswordReset';
import banner from '../assets/banner-transp.png';
import loginBackground from '../assets/login-bg.png';

export default function Login() {
  const { t } = useTranslation();
  
  // hooks
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    password: false
  });

  // Estados para controlar floating labels
  const [inputStates, setInputStates] = useState({
    email: { focused: false, hasValue: false },
    password: { focused: false, hasValue: false }
  });

  // Actualizar estado de inputs
  const updateInputState = (fieldName, updates) => {
    setInputStates(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], ...updates }
    }));
  };

  // Detectar autocompletado
  useEffect(() => {
    const checkAutofill = () => {
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      
      if (emailInput && emailInput.value && !inputStates.email.hasValue) {
        setEmail(emailInput.value);
        updateInputState('email', { hasValue: true });
      }
      
      if (passwordInput && passwordInput.value && !inputStates.password.hasValue) {
        setPassword(passwordInput.value);
        updateInputState('password', { hasValue: true });
      }
    };

    const timeouts = [100, 300, 500].map(delay => 
      setTimeout(checkAutofill, delay)
    );

    document.addEventListener('input', checkAutofill);

    return () => {
      timeouts.forEach(clearTimeout);
      document.removeEventListener('input', checkAutofill);
    };
  }, [inputStates.email.hasValue, inputStates.password.hasValue]);

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
      
      {/* Imagen de fondo  */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${loginBackground})`,
          opacity: 0.15,
          filter: 'brightness(0.4) contrast(1.2) hue-rotate(200deg)'
        }}
      />
      
      {/* Overlay con gradiente */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 70%)'
        }}
      />
      
      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen pb-16 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 px-2 sm:px-4 py-4">
        
        {/* Banner Image */}
        <div className="w-full lg:w-auto p-2 sm:p-4">
          <img
            src={banner}
            alt="Login Banner"
            className="max-h-[200px] sm:max-h-[300px] lg:max-h-[600px] object-contain mx-auto"
          />
        </div>

        {/* Login Form Container */}
        <div className="w-[280px] sm:w-[320px] md:w-96 p-2 sm:p-4 relative overflow-hidden z-0 login-border rounded-lg">
          <div className="relative z-10 bg-black/90 backdrop-blur-sm p-3 sm:p-4 md:p-6 rounded-lg">
            {/* language toggle */}
            <div className="flex justify-end mb-2 sm:mb-4">
              <LanguageToggle />
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-center text-gray-200">
              {t('login')} / {t('register')}
            </h2>

            <form 
              className="flex flex-col gap-3 sm:gap-4 text-gray-100"
              onSubmit={handleLogin}
              noValidate
            >
              {/* Email input con floating label */}
              <div className="input-group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    updateInputState('email', { hasValue: e.target.value.length > 0 });
                    clearFieldError('email');
                  }}
                  onFocus={() => updateInputState('email', { focused: true })}
                  onBlur={() => updateInputState('email', { focused: false })}
                  autoComplete="email"
                  className={`input w-full ${
                    fieldErrors.email 
                      ? 'border-red-500 focus:border-red-500' 
                      : ''
                  }`}
                />
                <label 
                  htmlFor="email" 
                  className={`user-label ${
                    inputStates.email.focused || inputStates.email.hasValue ? 'label-up' : ''
                  } ${
                    fieldErrors.email ? 'label-error' : ''
                  }`}
                >
                  {t('email')}
                </label>
              </div>

              {/* Password input con floating label */}
              <div className="input-group">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    updateInputState('password', { hasValue: e.target.value.length > 0 });
                    clearFieldError('password');
                  }}
                  onFocus={() => updateInputState('password', { focused: true })}
                  onBlur={() => updateInputState('password', { focused: false })}
                  autoComplete="current-password"
                  className={`input w-full ${
                    fieldErrors.password 
                      ? 'border-red-500 focus:border-red-500' 
                      : ''
                  }`}
                />
                <label 
                  htmlFor="password" 
                  className={`user-label ${
                    inputStates.password.focused || inputStates.password.hasValue ? 'label-up' : ''
                  } ${
                    fieldErrors.password ? 'label-error' : ''
                  }`}
                >
                  {t('password')}
                </label>
              </div>

              <div className="flex justify-between gap-2 sm:gap-3">
                <button
                  type="submit"
                  className="flex-1 px-2 sm:px-4 py-2 bg-green-700 hover:bg-gray-500 text-white font-medium rounded-md transition-colors duration-200 text-sm sm:text-base"
                >
                  {t('confirmLogin')}
                </button>
                <button
                  type="button"
                  onClick={handleSignUp}
                  className="flex-1 px-2 sm:px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-md transition-colors duration-200 text-sm sm:text-base"
                >
                  {t('confirmRegister')}
                </button>
              </div>
              
              {/* Forgot password link */}
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="text-sm sm:text-md text-gray-300 font-bold hover:text-white hover:underline transition-colors text-center mt-1 sm:mt-2"
              >
                {t('forgotPassword')}
              </button>
            </form>

            {/* social login buttons */}
            <div className="flex flex-col gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => handleSocialLogin('google')}
                className="flex items-center justify-center gap-2 px-2 sm:px-4 py-2 bg-white text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors duration-200 text-sm sm:text-base"
              >
                <FaGoogle className="w-4 h-4 sm:w-5 sm:h-5" />
                {t('loginWithGoogle')}
              </button>

              <button
                onClick={() => handleSocialLogin('github')}
                className="flex items-center justify-center gap-2 px-2 sm:px-4 py-2 bg-[#004d9f] hover:bg-gray-500 text-white font-medium rounded-md transition-colors duration-200 text-sm sm:text-base"
              >
                <FaGithub className="w-4 h-4 sm:w-5 sm:h-5" />
                {t('loginWithGithub')}
              </button>
            </div>

            {message && (
              <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-red-400">
                <PiWarningCircleFill className="w-4 h-4 sm:w-5 sm:h-5" />
                <p className="text-center text-sm sm:text-base">
                  {message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 py-4 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <small className="block text-center text-gray-400 text-xs">
            &copy; 2025 Deploy-Chat. All rights reserved.
          </small>
        </div>
      </footer>

    </div>
  );
}