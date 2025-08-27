import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { authApi } from '../api/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const withTimeout = useCallback(async (promise, timeoutMs, timeoutMessage = 'Request timed out') => {
        let timeoutId;
        try {
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
            });
            return await Promise.race([promise, timeoutPromise]);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }
    }, []);

    const fetchCurrentUser = useCallback(async (token) => {
        if (!token) {
            setCurrentUser(null);
            setLoading(false);
            return null;
        }
        try {
            const user = await authApi.getMe(token);
            setCurrentUser(user);
            return user;
        } catch (error) {
            console.error('AuthContext: Failed to fetch current user.', error);
            // If fetching the user fails, log them out completely.
            localStorage.removeItem('accessToken');
            setAccessToken(null);
            setCurrentUser(null);
            throw error; // Re-throw the error so the calling function knows it failed.
        }
    }, []);

    useEffect(() => {
        const bootstrapAuth = async () => {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            if (token) {
                await fetchCurrentUser(token).catch(() => {
                    // Catch errors on initial load, user will be logged out.
                });
            }
            setLoading(false);
        };
        bootstrapAuth();
    }, [fetchCurrentUser]);
    
    // --- THIS IS THE CORRECTED LOGIN FUNCTION ---
    const login = async (email, password) => {
        // 1. Set global loading state to true at the very beginning.
        setLoading(true);
        try {
            // 2. Get the token from the API.
            const data = await authApi.login(email, password);
            localStorage.setItem('accessToken', data.access_token);
            setAccessToken(data.access_token);

            // 3. Fetch the user data with a timeout guard so UI never hangs.
            await withTimeout(
                fetchCurrentUser(data.access_token),
                8000,
                'Fetching profile took too long'
            ).catch((err) => {
                // Log but do not block login navigation if profile is slow
                console.warn('Proceeding without profile due to error:', err?.message || err);
            });
            
        } catch (error) {
            // 4. If anything fails, ensure loading is off and re-throw the error.
            setLoading(false);
            throw error;
        } finally {
            // 5. Ensure loading is always set to false when the process is complete.
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        setAccessToken(null);
        setCurrentUser(null);
    };

    const value = {
        accessToken,
        isAuthenticated: !!currentUser, // isAuthenticated is now derived directly from currentUser
        currentUser,
        loading,
        login,
        logout,
        refreshCurrentUser: () => fetchCurrentUser(accessToken),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 
    
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
};
// Remove useAuth export from this file for Fast Refresh compatibility.


