import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'

// Intercept and handle auth redirects
const handleAuthRedirect = () => {
  const currentUrl = window.location.href;
  const urlObj = new URL(currentUrl);
  const urlParams = urlObj.searchParams;
  
  // Extract relevant parameters
  const accessToken = urlParams.get('access_token');
  const refreshToken = urlParams.get('refresh_token');
  const type = urlParams.get('type');
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  const code = urlParams.get('code'); 
  
  // Recovery message with PKCE code
  if (code && urlObj.pathname === '/reset-password') {
    sessionStorage.setItem('auth_recovery_code', code);
    sessionStorage.setItem('auth_recovery_type', 'pkce');
    sessionStorage.setItem('auth_flow_active', 'recovery');
    sessionStorage.setItem('auth_recovery_timestamp', Date.now().toString());
    
    // Don't clean URL to preserve code for further steps
    return 'recovery_pkce';
  }
  
  // Recovery with direct tokens
  if (accessToken && (type === 'recovery' || urlObj.pathname.includes('reset'))) {
    sessionStorage.setItem('auth_recovery_access_token', accessToken);
    if (refreshToken) {
      sessionStorage.setItem('auth_recovery_refresh_token', refreshToken);
    }
    sessionStorage.setItem('auth_recovery_type', type || 'recovery');
    sessionStorage.setItem('auth_flow_active', 'recovery');
    sessionStorage.setItem('auth_recovery_timestamp', Date.now().toString());
    
    // Clean URL to remove tokens
    const cleanUrl = urlObj.origin + '/reset-password';
    window.history.replaceState({}, 'Password Reset', cleanUrl);
    
    return 'recovery_tokens';
  }
  
  // Handle normal login with tokens
  if (accessToken && !type) {
    sessionStorage.setItem('auth_login_access_token', accessToken);
    if (refreshToken) {
      sessionStorage.setItem('auth_login_refresh_token', refreshToken);
    }
    sessionStorage.setItem('auth_flow_active', 'login');
    
    const cleanUrl = urlObj.origin + '/';
    window.history.replaceState({}, '', cleanUrl);
    
    return 'login';
  }

  // Handle errors
  if (error) {
    sessionStorage.setItem('auth_error', error);
    if (errorDescription) {
      sessionStorage.setItem('auth_error_description', errorDescription);
    }
    
    const cleanUrl = urlObj.origin + '/';
    window.history.replaceState({}, '', cleanUrl);
    return 'error';
  }
  
  return null;
};

// Execute interceptor before initializing React
const authFlow = handleAuthRedirect();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)