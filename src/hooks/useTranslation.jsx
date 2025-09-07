import { createContext, useContext, useState } from 'react';

// traducciones
const translations = {
  es: {
    // Auth
    login: "Login",
    register: "Registro",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmLogin: "Iniciar sesión",
    confirmRegister: "Registrarse",
    logout: "Cerrar sesión",
    loginWithGithub: "Iniciar con GitHub",
    loginWithGoogle: "Iniciar con Google",
    checkEmail: "Revisa tu correo para confirmar la cuenta",
    
    // Chat
    sendMessage: "Enviar",
    typing: "escribiendo...",
    online: "conectado",
    offline: "desconectado",
    messageInput: "Mensaje",
    noMessages: "No hay mensajes aún",

    // Members count
    oneMember: "1 miembro",
    membersCount: "{count} miembros",
    
    // Channels
    general: "General",
    random: "Random",
    tech: "Tecnología",
    createChannel: "Crear canal",
    joinChannel: "Unirse al canal",
    leaveChannel: "Salir del canal",
    
    // UI
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
    language: "Idioma",
    settings: "Configuración",
    profile: "Perfil",
    
    // Navigation
    home: "Inicio",
    channels: "Canales",
    directMessages: "Mensajes directos",
    
    // Messages
    pinnedMessages: "Mensajes fijados",
    pinMessage: "Fijar mensaje",
    unpinMessage: "Desfijar mensaje",
    deleteMessage: "Eliminar mensaje",
    editMessage: "Editar mensaje",
    
    // Errors y validaciones
    errorLogin: "Error al iniciar sesión",
    errorRegister: "Error al registrarse",
    errorSendMessage: "Error al enviar mensaje",
    invalidCredentials: "Credenciales inválidas",
    missingEmail: "Por favor ingresa tu email",
    missingPassword: "Por favor ingresa tu contraseña",
    invalidEmail: "Por favor ingresa un email válido",
    passwordTooShort: "La contraseña debe tener al menos 6 caracteres",
    unexpectedError: "Error inesperado",
    
    // Time
    now: "ahora",
    minutesAgo: "hace {count} minutos",
    hoursAgo: "hace {count} horas",
    daysAgo: "hace {count} días",

    // Recuperar contraseña
    forgotPassword: "¿Olvidaste tu contraseña?",
    resetPassword: "Restablecer contraseña",
    newPassword: "Nueva contraseña",
    confirmNewPassword: "Confirmar nueva contraseña",
    sendResetEmail: "Enviar enlace",
    resetEmailSent: "Revisa tu correo para restablecer la contraseña",
    passwordsDoNotMatch: "Las contraseñas no coinciden",
    passwordUpdated: "Contraseña actualizada exitosamente",
    backToLogin: "Volver al inicio",
    enterEmailToReset: "Ingresa el email asociado a tu cuenta para recibir el enlace de restablecimiento.",
  },
  en: {
    // Auth
    login: "Sign In",
    register: "Sign Up",
    email: "Email",
    password: "Password",
    confirmLogin: "Login",
    confirmRegister: "Register",
    logout: "Sign Out",
    loginWithGithub: "Sign in with GitHub",
    loginWithGoogle: "Sign in with Google",
    checkEmail: "Check your email to confirm your account",
    
    // Chat
    sendMessage: "Send",
    typing: "typing...",
    online: "online",
    offline: "offline",
    messageInput: "Message",
    noMessages: "No messages yet",

    // Members count  
    oneMember: "1 member",
    membersCount: "{count} members",
    
    // Channels
    general: "General",
    random: "Random",
    tech: "Tech",
    createChannel: "Create channel",
    joinChannel: "Join channel",
    leaveChannel: "Leave channel",
    
    // UI
    darkMode: "Dark mode",
    lightMode: "Light mode",
    language: "Language",
    settings: "Settings",
    profile: "Profile",
    
    // Navigation
    home: "Home",
    channels: "Channels",
    directMessages: "Direct Messages",
    
    // Messages
    pinnedMessages: "Pinned messages",
    pinMessage: "Pin message",
    unpinMessage: "Unpin message",
    deleteMessage: "Delete message",
    editMessage: "Edit message",
    
    // Errors y validaciones
    errorLogin: "Login error",
    errorRegister: "Registration error",
    errorSendMessage: "Error sending message",
    invalidCredentials: "Invalid login credentials",
    missingEmail: "Please enter your email",
    missingPassword: "Please enter your password",
    invalidEmail: "Please enter a valid email",
    passwordTooShort: "Password must be at least 6 characters",
    unexpectedError: "Unexpected error",
    
    // Time
    now: "now",
    minutesAgo: "{count} minutes ago",
    hoursAgo: "{count} hours ago",
    daysAgo: "{count} days ago",
  
  // Forgot Password
    forgotPassword: "Forgot your password?",
    resetPassword: "Reset password",
    newPassword: "New password",
    confirmNewPassword: "Confirm new password",
    sendResetEmail: "Send link",
    resetEmailSent: "Check your email to reset your password",
    passwordsDoNotMatch: "Passwords do not match",
    passwordUpdated: "Password updated successfully",
    backToLogin: "Back to home",
    enterEmailToReset: "Enter the email associated with your account to receive the reset link.",
  }
};

// Contexto para el idioma
const LanguageContext = createContext();

// Provider del idioma
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    localStorage.getItem('language') || 'es'
  );

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  // Función para obtener traducciones
  const t = (key) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook para usar las traducciones
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return context;
}