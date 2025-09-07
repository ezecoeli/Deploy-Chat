import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Login from '../sections/Login';
import Chat from '../sections/Chat';
import UpdatePassword from './UpdatePassword';

export default function Router() {
    const { user, loading } = useAuth();
    const [currentRoute, setCurrentRoute] = useState('/');
    const [resetData, setResetData] = useState(null);

    // Detectar cambios de ruta
    useEffect(() => {
        const handleRouteChange = () => {
            const path = window.location.pathname;
            const authFlow = sessionStorage.getItem('auth_flow_active');

            // LOGGING 
            console.log('Router: handleRouteChange INICIADO');
            console.log('Router: URL actual:', window.location.href);
            console.log('Router: path:', path);
            console.log('Router: authFlow:', authFlow);

            // Log completo del sessionStorage
            const storageData = {
                auth_recovery_access_token: sessionStorage.getItem('auth_recovery_access_token'),
                auth_recovery_refresh_token: sessionStorage.getItem('auth_recovery_refresh_token'),
                auth_recovery_code: sessionStorage.getItem('auth_recovery_code'), // AÑADIR ESTA LÍNEA
                auth_recovery_type: sessionStorage.getItem('auth_recovery_type'),
                auth_flow_active: sessionStorage.getItem('auth_flow_active'),
                auth_recovery_timestamp: sessionStorage.getItem('auth_recovery_timestamp')
            };

            console.log('Router: sessionStorage completo:', storageData);

            // Detectar password recovery
            if (path === '/reset-password') {
                // Verificar ambos formatos: tokens directos Y código PKCE
                const accessToken = sessionStorage.getItem('auth_recovery_access_token');
                const refreshToken = sessionStorage.getItem('auth_recovery_refresh_token');
                const recoveryCode = sessionStorage.getItem('auth_recovery_code');
                const type = sessionStorage.getItem('auth_recovery_type');
                const authFlowCheck = sessionStorage.getItem('auth_flow_active');

                console.log('Router: Verificando tokens recovery:', {
                    accessToken: accessToken ? 'PRESENTE' : 'AUSENTE',
                    refreshToken: refreshToken ? 'PRESENTE' : 'AUSENTE',
                    recoveryCode: recoveryCode ? 'PRESENTE' : 'AUSENTE',
                    type,
                    authFlowCheck
                });

                // Verificar si hay datos de recovery válidos (tokens O código)
                if (authFlowCheck === 'recovery' && (accessToken || recoveryCode)) {
                    console.log('Router: Recovery detectado, preparando resetData');

                    const resetData = {
                        accessToken,
                        refreshToken,
                        code: recoveryCode,
                        type
                    };

                    setResetData(resetData);
                    setCurrentRoute('/reset-password');
                    return;
                } else {
                    console.log('Router: No hay tokens de recovery válidos');
                    console.log('Router: sessionStorage completo:', {
                        auth_recovery_access_token: sessionStorage.getItem('auth_recovery_access_token'),
                        auth_recovery_code: sessionStorage.getItem('auth_recovery_code'),
                        auth_recovery_type: sessionStorage.getItem('auth_recovery_type'),
                        auth_flow_active: sessionStorage.getItem('auth_flow_active')
                    });

                    // Si no hay tokens válidos, redirigir al login
                    setCurrentRoute('/');
                    window.history.replaceState({}, document.title, '/');
                    return;
                }
            }

            // Rutas normales
            setCurrentRoute(path);
            setResetData(null);
        };

        // Ejecutar al cargar con un pequeño delay
        const timer = setTimeout(handleRouteChange, 100);

        // Escuchar cambios de navegación
        window.addEventListener('popstate', handleRouteChange);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, []);

    // Loading state
    if (loading) {
        console.log('Router: Mostrando loading...');
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Cargando...</p>
                </div>
            </div>
        );
    }

    // Password reset flow
    if (currentRoute === '/reset-password' && resetData) {
        console.log('Router: Mostrando UpdatePassword con datos de sessionStorage');
        return (
            <UpdatePassword
                resetData={resetData}
                onPasswordUpdated={() => {
                    console.log('Router: Password actualizado, limpiando sessionStorage...');
                    
                    // Limpiar sessionStorage 
                    sessionStorage.removeItem('auth_recovery_access_token');
                    sessionStorage.removeItem('auth_recovery_refresh_token');
                    sessionStorage.removeItem('auth_recovery_code'); 
                    sessionStorage.removeItem('auth_recovery_type');
                    sessionStorage.removeItem('auth_flow_active');
                    
                    setCurrentRoute('/');
                    setResetData(null);
                    window.history.replaceState({}, document.title, '/');
                }}
            />
        );
    }

    // Si estamos en /reset-password pero no hay resetData, mostrar mensaje de debug
    if (currentRoute === '/reset-password' && !resetData) {
        console.log('Router: En /reset-password pero sin resetData');
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
                <div className="text-white text-center p-8">
                    <h2 className="text-xl mb-4">Debug: Reset Password</h2>
                    <p className="mb-2">Ruta: {currentRoute}</p>
                    <p className="mb-2">resetData: {resetData ? 'PRESENTE' : 'AUSENTE'}</p>
                    <p className="mb-2">sessionStorage tokens:</p>
                    <pre className="text-sm bg-gray-800 p-4 rounded">
                        {JSON.stringify({
                            auth_recovery_access_token: sessionStorage.getItem('auth_recovery_access_token') ? 'PRESENTE' : 'AUSENTE',
                            auth_recovery_refresh_token: sessionStorage.getItem('auth_recovery_refresh_token') ? 'PRESENTE' : 'AUSENTE',
                            auth_recovery_type: sessionStorage.getItem('auth_recovery_type'),
                            auth_flow_active: sessionStorage.getItem('auth_flow_active')
                        }, null, 2)}
                    </pre>
                    <button
                        onClick={() => {
                            setCurrentRoute('/');
                            window.history.replaceState({}, document.title, '/');
                        }}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Ir al Login
                    </button>
                </div>
            </div>
        );
    }

    // Rutas autenticadas
    if (user) {
        switch (currentRoute) {
            case '/chat':
            case '/':
                console.log('Router: Mostrando Chat');
                return <Chat />;
            default:
                console.log('Router: Ruta desconocida, redirigiendo a Chat');
                window.history.replaceState({}, document.title, '/');
                return <Chat />;
        }
    }

    // Debug function para desarrollo
    if (process.env.NODE_ENV === 'development') {
        window.__debugRouter = () => ({
            currentRoute,
            resetData: resetData ? 'PRESENTE' : 'AUSENTE',
            user: user?.email || 'null',
            loading,
            sessionStorage: {
                auth_recovery_access_token: sessionStorage.getItem('auth_recovery_access_token') ? 'PRESENTE' : 'AUSENTE',
                auth_recovery_refresh_token: sessionStorage.getItem('auth_recovery_refresh_token') ? 'PRESENTE' : 'AUSENTE',
                auth_recovery_code: sessionStorage.getItem('auth_recovery_code') ? 'PRESENTE' : 'AUSENTE',
                auth_recovery_type: sessionStorage.getItem('auth_recovery_type'),
                auth_flow_active: sessionStorage.getItem('auth_flow_active')
            },
            location: {
                pathname: window.location.pathname,
                search: window.location.search
            }
        });
    }

    // Sin autenticar
    console.log('Router: Mostrando Login');
    return <Login />;
}