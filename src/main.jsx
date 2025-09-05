import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Interceptar todos los parámetros de auth antes de que se inicialice la app
const handleAuthRedirect = () => {
  const currentUrl = window.location.href;
  const urlObj = new URL(currentUrl);
  const urlParams = urlObj.searchParams;
  
  // Extraer todos los parámetros posibles
  const accessToken = urlParams.get('access_token');
  const refreshToken = urlParams.get('refresh_token');
  const type = urlParams.get('type');
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  const code = urlParams.get('code'); 
  
  console.log('main.jsx: URL completa:', currentUrl);
  console.log('main.jsx: Verificando parámetros de auth:', {
    accessToken: accessToken ? 'PRESENTE' : 'AUSENTE',
    refreshToken: refreshToken ? 'PRESENTE' : 'AUSENTE',
    type,
    error,
    errorDescription,
    code: code ? 'PRESENTE' : 'AUSENTE',
    pathname: urlObj.pathname,
    search: urlObj.search,
    allParams: Object.fromEntries(urlParams.entries())
  });
  
  // Manejar recovery con código PKCE
  if (code && urlObj.pathname === '/reset-password') {
    console.log('main.jsx: Recovery PKCE detectado (code + reset-password path)');
    
    sessionStorage.setItem('auth_recovery_code', code);
    sessionStorage.setItem('auth_recovery_type', 'pkce');
    sessionStorage.setItem('auth_flow_active', 'recovery');
    sessionStorage.setItem('auth_recovery_timestamp', Date.now().toString());
    
    // no limpiar URL porque necesitamos el código para el intercambio
    console.log('main.jsx: Recovery PKCE almacenado, manteniendo URL con código');
    console.log('main.jsx: sessionStorage después de almacenar:', {
      auth_recovery_code: sessionStorage.getItem('auth_recovery_code'),
      auth_recovery_type: sessionStorage.getItem('auth_recovery_type'),
      auth_flow_active: sessionStorage.getItem('auth_flow_active'),
      auth_recovery_timestamp: sessionStorage.getItem('auth_recovery_timestamp')
    });
    
    return 'recovery_pkce';
  }
  
  // Manejar recovery con tokens directos
  if (accessToken && (type === 'recovery' || urlObj.pathname.includes('reset'))) {
    console.log('main.jsx: Recovery con tokens directos detectado');
    
    sessionStorage.setItem('auth_recovery_access_token', accessToken);
    if (refreshToken) {
      sessionStorage.setItem('auth_recovery_refresh_token', refreshToken);
    }
    sessionStorage.setItem('auth_recovery_type', type || 'recovery');
    sessionStorage.setItem('auth_flow_active', 'recovery');
    sessionStorage.setItem('auth_recovery_timestamp', Date.now().toString());
    
    // Limpiar URL
    const cleanUrl = urlObj.origin + '/reset-password';
    window.history.replaceState({}, 'Password Reset', cleanUrl);
    
    console.log('main.jsx: Recovery con tokens almacenado');
    return 'recovery_tokens';
  }
  
  // Manejar login normal con tokens
  if (accessToken && !type) {
    console.log('main.jsx: Login normal con tokens detectado');
    
    sessionStorage.setItem('auth_login_access_token', accessToken);
    if (refreshToken) {
      sessionStorage.setItem('auth_login_refresh_token', refreshToken);
    }
    sessionStorage.setItem('auth_flow_active', 'login');
    
    const cleanUrl = urlObj.origin + '/';
    window.history.replaceState({}, '', cleanUrl);
    
    console.log('main.jsx: Login tokens almacenados');
    return 'login';
  }
  
  // Manejar errores
  if (error) {
    console.log('main.jsx: Error de auth detectado:', error);
    sessionStorage.setItem('auth_error', error);
    if (errorDescription) {
      sessionStorage.setItem('auth_error_description', errorDescription);
    }
    
    const cleanUrl = urlObj.origin + '/';
    window.history.replaceState({}, '', cleanUrl);
    return 'error';
  }
  
  console.log('main.jsx: No se detectó ningún flujo de auth especial');
  return null;
};

// Ejecutar interceptor antes de inicializar React
const authFlow = handleAuthRedirect();
console.log('main.jsx: Flujo de auth detectado:', authFlow);

// Debug global
window.__debugAuth = () => ({
  authFlow,
  currentUrl: window.location.href,
  sessionStorage: {
    auth_recovery_code: sessionStorage.getItem('auth_recovery_code'),
    auth_recovery_access_token: sessionStorage.getItem('auth_recovery_access_token'),
    auth_recovery_type: sessionStorage.getItem('auth_recovery_type'),
    auth_flow_active: sessionStorage.getItem('auth_flow_active'),
    auth_recovery_timestamp: sessionStorage.getItem('auth_recovery_timestamp')
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)