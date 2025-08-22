# Deploy-chat - Roadmap

## Objetivo
Crear una aplicación de chat en tiempo real para developers con características originales, gratuita y responsive, usando React y Supabase.

## Fases del proyecto

### Fase 1: Setup inicial
- [ ] Crear proyecto React con Vite o Create React App
- [ ] Instalar TailwindCSS y configurar dark/light mode
- [ ] Configurar Supabase (auth + base de datos + realtime)
- [ ] Estructura de carpetas (components, sections, assets, utils, context, hooks)

### Fase 2: Autenticación
- [ ] Registro/login con correo
- [ ] Login con GitHub
- [ ] Login con Google
- [ ] Logout
- [ ] Guardar usuarios en Supabase

### Fase 3: Chat básico
- [ ] Crear sala #general
- [ ] Enviar y recibir mensajes en tiempo real
- [ ] Mostrar avatar y nombre del usuario
- [ ] Scroll automático al último mensaje

### Fase 4: Canales y organización
- [ ] Crear múltiples canales (#random, #tech, etc.)
- [ ] Unirse/salir de canales
- [ ] Mostrar lista de canales activos
- [ ] Chats 1 a 1 (privados)

### Fase 5: Experiencia visual y UX
- [ ] Selector de idioma (ES/EN) 
- [ ] Dark/light mode toggle
- [ ] Animaciones de entrada con Framer Motion
- [ ] Modo retro terminal
- [ ] Avatares generados automáticamente

### Fase 6: Funcionalidades extra
- [ ] Mensajes con Markdown y highlight de código
- [ ] Reacciones rápidas con emojis
- [ ] Mensajes fijados
- [ ] Estado de conexión (online / escribiendo…)

### Fase 7: Integraciones
- [ ] Giphy API → GIFs en mensajes
- [ ] Unsplash API → imágenes
- [ ] Quotes API → frase motivadora al entrar
- [ ] Traducción automática de mensajes

### Fase 8: Testing y despliegue
- [ ] Test funcional de chat y auth
- [ ] Responsiveness en móvil y desktop
- [ ] Deploy gratuito en Vercel o Netlify

## Notas
- Todas las funciones deben ser gratuitas.
- Priorizar Supabase para backend y realtime.
- Animaciones con Framer Motion para dar dinamismo.

