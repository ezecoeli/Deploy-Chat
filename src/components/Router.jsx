import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Login from '../sections/Login';
import Chat from '../sections/Chat';
import UpdatePassword from './UpdatePassword';

export default function Router() {
    const { user, loading } = useAuth();
    const [currentRoute, setCurrentRoute] = useState('/');
    const [resetData, setResetData] = useState(null);

    // Detect route changes
    useEffect(() => {
        const handleRouteChange = () => {
            const path = window.location.pathname;
            const authFlow = sessionStorage.getItem('auth_flow_active');

            // Detect password recovery
            if (path === '/reset-password') {
                // Check both formats: direct tokens AND PKCE code
                const accessToken = sessionStorage.getItem('auth_recovery_access_token');
                const refreshToken = sessionStorage.getItem('auth_recovery_refresh_token');
                const recoveryCode = sessionStorage.getItem('auth_recovery_code');
                const type = sessionStorage.getItem('auth_recovery_type');
                const authFlowCheck = sessionStorage.getItem('auth_flow_active');

                // Check if there are valid recovery data (tokens OR code)
                if (authFlowCheck === 'recovery' && (accessToken || recoveryCode)) {
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
                    // If no valid tokens, redirect to login
                    setCurrentRoute('/');
                    window.history.replaceState({}, document.title, '/');
                    return;
                }
            }

            // Normal routes
            setCurrentRoute(path);
            setResetData(null);
        };

        // Execute on load with a small delay
        const timer = setTimeout(handleRouteChange, 100);

        // Listen for navigation changes
        window.addEventListener('popstate', handleRouteChange);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    // Password reset flow
    if (currentRoute === '/reset-password' && resetData) {
        return (
            <UpdatePassword
                resetData={resetData}
                onPasswordUpdated={() => {
                    // Clean sessionStorage 
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

    // If we're on /reset-password but no resetData, redirect to login
    if (currentRoute === '/reset-password' && !resetData) {
        setCurrentRoute('/');
        window.history.replaceState({}, document.title, '/');
        return <Login />;
    }

    // Authenticated routes
    if (user) {
        switch (currentRoute) {
            case '/chat':
            case '/':
                return <Chat />;
            default:
                window.history.replaceState({}, document.title, '/');
                return <Chat />;
        }
    }

    // Unauthenticated
    return <Login />;
}