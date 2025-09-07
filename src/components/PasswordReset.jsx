import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useTranslation } from '../hooks/useTranslation';
import { PiWarningCircleFill } from "react-icons/pi";
import LanguageToggle from './LanguageToggle';
import banner from '../assets/banner-transp.png';
import loginBackground from '../assets/login-bg.png';

export default function PasswordReset({ onBackToLogin }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage(t('missingEmail'));
      return;
    }

    if (!email.includes('@')) {
      setMessage(t('invalidEmail'));
      return;
    }

    setIsLoading(true);
    setMessage(''); // LIMPIAR mensaje anterior

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setMessage(error.message);
        setEmailSent(false); 
      } else {
        setMessage('');
        setEmailSent(true); 
      }
    } catch (err) {
      setMessage(t('unexpectedError'));
      setEmailSent(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Fondos existentes */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800" />
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${loginBackground})`,
          opacity: 0.15,
          filter: 'brightness(0.4) contrast(1.2) hue-rotate(200deg)'
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 70%)'
        }}
      />
      
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-screen w-full gap-8 px-4">
        
        {/* Banner Image */}
        <div className="w-full lg:w-auto p-4">
          <img
            src={banner}
            alt="Reset Password Banner"
            className="max-h-[400px] lg:max-h-[600px] object-contain mx-auto"
          />
        </div>

        {/* Reset Form Container */}
        <div className="w-[320px] sm:w-96 p-4 relative overflow-hidden z-0 login-border rounded-lg">
          <div className="relative z-10 bg-black/90 backdrop-blur-sm p-6 rounded-lg">
            {/* Language toggle */}
            <div className="flex justify-end mb-4">
              <LanguageToggle />
            </div>

            <h2 className="text-3xl font-bold mb-8 text-center text-gray-200">
              {t('resetPassword')}
            </h2>

            {!emailSent ? (
              <>
                <p className="text-gray-300 text-md mb-6 text-center">
                  {t('enterEmailToReset')}
                </p>

                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    placeholder={t('email')}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (message) setMessage(''); // limpiar mensaje al escribir
                    }}
                    autoComplete="email"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-base text-gray-800"
                    disabled={isLoading}
                  />
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-medium rounded-md transition-colors duration-200 text-base disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {isLoading ? 'Enviando...' : t('sendResetEmail')}
                  </button>
                </form>

                {/* mensajes de error solo cuando no se envía el email */}
                {message && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-red-400">
                    <PiWarningCircleFill className="w-5 h-5" />
                    <p className="text-center text-base">
                      {message}
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* mensaje de éxito cuando se envía el email */
              <div className="text-center">
                <div className="mb-6 text-green-400">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-lg font-medium">{t('resetEmailSent')}</p>
                </div>
              </div>
            )}

            {/* Back to login button */}
            <button
              onClick={onBackToLogin}
              className="w-full mt-6 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-md transition-colors duration-200 text-base"
            >
              {t('backToLogin')}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}