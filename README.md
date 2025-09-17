# Deploy-Chat

Una plataforma de chat diseñada específicamente para equipos de desarrollo, con temas de terminal, syntax highlighting avanzado, IA integrada y encriptación E2E, donde la nostalgia tecnológica se encuentra con funcionalidad moderna.

## Características Principales

- **Chat en tiempo real** con WebSocket para múltiples canales públicos
- **Mensajes directos encriptados** con encriptación E2E usando Web Crypto API
- **Soporte completo de Markdown** con syntax highlighting para código
- **Múltiples temas de terminal** (Matrix, CoolRetro, Ubuntu, macOS, Windows95)
- **Sistema de autenticación** con GitHub y Google OAuth
- **IA Assistant integrada** con Groq API para ayuda en desarrollo
- **Sistema de bots programables** con eventos automáticos
- **Indicadores de mensajes no leídos** persistentes
- **Internacionalización** ES/EN con sistema propio
- **Efectos visuales temáticos** como Matrix Rain y cursores de terminal

## Tecnologías Utilizadas

### Core Framework y Build Tools
- **React 19** - Framework principal de la aplicación
- **Vite** - Build tool y servidor de desarrollo con @vitejs/plugin-react
- **TailwindCSS** - Framework de CSS para estilos responsive
- **PostCSS** - Procesamiento de CSS con autoprefixer

### Backend y Base de Datos
- **Supabase** - Backend-as-a-Service completo
- **PostgreSQL** - Base de datos relacional con pg_cron para tareas programadas
- **Supabase Realtime** - WebSocket para mensajes en tiempo real
- **Supabase Auth** - Autenticación con GitHub y Google OAuth
- **Supabase Edge Functions** - Funciones serverless con Deno runtime
- **Row Level Security (RLS)** - Sistema de seguridad granular de Supabase

### Chat y Markdown
- **react-markdown** - Renderizado de Markdown en mensajes
- **remark-gfm** - GitHub Flavored Markdown
- **react-syntax-highlighter** - Syntax highlighting para código con temas Prism

### UI y Efectos Visuales
- **Framer Motion** - Animaciones y transiciones fluidas
- **React Icons** - Iconografía completa (Feather, Bootstrap, Font Awesome, Material Design, Phosphor, Lucide, Ionicons, Tabler)
- **Canvas API** - Efectos visuales como Matrix Rain
- **CSS Animations** - Terminal cursor y efectos de interfaz

### Seguridad y Encriptación
- **Web Crypto API** - Encriptación E2E para chats privados
- **AES-GCM** - Algoritmo de encriptación simétrica
- **PBKDF2** - Derivación segura de claves

### Integraciones de IA
- **Groq API** - Servicio de IA para chat assistant
- **Supabase Edge Functions** - Lógica de IA serverless

### Utilidades y APIs Nativas
- **Custom React Hooks** - useAuth, useTerminalTheme, useBotEvents, useUnreadMessages, etc.
- **LocalStorage API** - Persistencia de configuraciones y estado
- **Web Crypto API** - Encriptación nativa del navegador
- **Custom i18n System** - Sistema de traducción propio ES/EN

### Herramientas de Desarrollo
- **ESLint** - Linting de código con plugins para React Hooks y React Refresh
- **Deno** - Runtime para Edge Functions de Supabase
- **Supabase CLI** - Herramientas de línea de comandos para deployment
- **Git** - Control de versiones
- **VS Code** - IDE principal recomendado
- **Chrome DevTools** - Debugging y testing

### Servicios Cloud
- **Supabase** - Backend completo
- **Vercel/Netlify** - Hosting (posible deploy)
- **GitHub** - Repositorio y CI/CD