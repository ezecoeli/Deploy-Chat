import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function UpdatePassword({ resetData, onPasswordUpdated }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionSet, setSessionSet] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('UpdatePassword montado con resetData:', resetData);
    console.log('UpdatePassword sessionStorage completo:', {
      auth_recovery_access_token: sessionStorage.getItem('auth_recovery_access_token'),
      auth_recovery_refresh_token: sessionStorage.getItem('auth_recovery_refresh_token'),
      auth_recovery_code: sessionStorage.getItem('auth_recovery_code'),
      auth_recovery_type: sessionStorage.getItem('auth_recovery_type'),
      auth_flow_active: sessionStorage.getItem('auth_flow_active')
    });
  }, [resetData]);

  useEffect(() => {
    if (!resetData) {
      console.log('UpdatePassword: No resetData provided');
      setSessionSet(true);
      return;
    }

    const setRecoverySession = async () => {
      if (sessionSet) return;

      console.log('UpdatePassword: Procesando resetData:', {
        hasAccessToken: !!resetData.accessToken,
        hasCode: !!resetData.code,
        type: resetData.type
      });
      
      setIsLoading(true);

      try {
        // Para código PKCE, verificar si ya hay sesión o intentar múltiples estrategias
        if (resetData.code && resetData.type === 'pkce') {
          console.log('UpdatePassword: Manejando código PKCE...');
          
          // Verificar si ya hay sesión activa
          const { data: currentSession, error: sessionError } = await supabase.auth.getSession();
          
          if (currentSession.session?.user && !sessionError) {
            console.log('UpdatePassword: Sesión ya establecida automáticamente:', currentSession.session.user.email);
            setSessionSet(true);
            setIsLoading(false);
            return;
          }
          
          // Intentar intercambio manual
          const currentUrl = new URL(window.location.href);
          const urlCode = currentUrl.searchParams.get('code');
          
          if (urlCode) {
            console.log('UpdatePassword: Intentando intercambio manual...');
            
            try {
              const { data, error } = await supabase.auth.exchangeCodeForSession(urlCode);
              
              if (!error && data.user) {
                console.log('UpdatePassword: Intercambio manual exitoso:', data.user.email);
                setSessionSet(true);
                window.history.replaceState({}, '', '/reset-password');
              } else {
                console.log('UpdatePassword: Intercambio manual falló, pero continuando...');
                
              }
            } catch (exchangeError) {
              console.log('UpdatePassword: Error en intercambio manual:', exchangeError.message);
              
            }
          }
          
          // Esperar  y verificar sesión de nuevo
          if (!sessionSet) {
            console.log('UpdatePassword: Esperando establecimiento automático de sesión...');
            
            setTimeout(async () => {
              const { data: delayedSession } = await supabase.auth.getSession();
              
              if (delayedSession.session?.user) {
                console.log('UpdatePassword: Sesión establecida después de delay:', delayedSession.session.user.email);
                setSessionSet(true);
              } else {
                console.log('UpdatePassword: No se pudo establecer sesión PKCE');
                setMessage('Error: No se pudo establecer la sesión de recuperación');
              }
              setIsLoading(false);
            }, 1000);
            
            return;
          }
        }
        // Si tenemos tokens directos, usarlos
        else if (resetData.accessToken) {
          console.log('UpdatePassword: Estableciendo sesión con tokens directos...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: resetData.accessToken,
            refresh_token: resetData.refreshToken || ''
          });

          if (error) {
            console.error('UpdatePassword: Error estableciendo sesión:', error);
            setMessage('Error: Enlace de recuperación inválido o expirado');
          } else {
            console.log('UpdatePassword: Sesión establecida con tokens:', data.user?.email);
            setSessionSet(true);
          }
        } else {
          setMessage('Error: No se encontraron datos de recuperación válidos');
        }
      } catch (err) {
        console.error('UpdatePassword: Error inesperado:', err);
        setMessage('Error inesperado al procesar el enlace de recuperación');
      } finally {
        if (resetData.type !== 'pkce' || sessionSet) {
          setIsLoading(false);
        }
      }
    };

    setRecoverySession();
  }, [resetData, sessionSet]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      console.log('UpdatePassword: Actualizando contraseña...');
      
      // Verificar sesión antes de actualizar
      const { data: sessionCheck } = await supabase.auth.getSession();
      if (!sessionCheck.session?.user) {
        setMessage('Error: Sesión expirada. Por favor, solicita un nuevo enlace.');
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('UpdatePassword: Error actualizando contraseña:', error);
        setMessage('Error al actualizar la contraseña: ' + error.message);
      } else {
        console.log('UpdatePassword: Contraseña actualizada exitosamente');
        setMessage('Contraseña actualizada exitosamente. Redirigiendo...');
        
        // Logout para limpiar la sesión temporal
        setTimeout(async () => {
          console.log('UpdatePassword: Cerrando sesión temporal...');
          await supabase.auth.signOut();
          
          if (onPasswordUpdated) {
            onPasswordUpdated();
          }
        }, 2000);
      }
    } catch (err) {
      console.error('UpdatePassword: Error inesperado:', err);
      setMessage('Error inesperado al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading mientras se establece la sesión
  if (!sessionSet && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 w-full max-w-md mx-4 border border-white/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Procesando enlace</h2>
            <p className="text-gray-300">Verificando enlace de recuperación...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si no se pudo establecer la sesión
  if (!sessionSet && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 w-full max-w-md mx-4 border border-white/20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-red-400 mb-4">{message || 'No se pudo procesar el enlace de recuperación'}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de actualización de contraseña
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 w-full max-w-md mx-4 border border-white/20 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Nueva Contraseña
        </h2>
        
        {message && (
          <div className={`p-3 rounded mb-4 text-center ${
            message.includes('exitosamente') 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ingresa tu nueva contraseña"
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Confirma tu nueva contraseña"
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Actualizando...
              </div>
            ) : (
              'Actualizar Contraseña'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}