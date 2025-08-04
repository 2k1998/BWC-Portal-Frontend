import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/apiService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initializationComplete, setInitializationComplete] = useState(false);

    const fetchCurrentUser = useCallback(async (token) => {
        if (!token) {
            setCurrentUser(null);
            return null;
        }
        
        try {
            const user = await authApi.getMe(token);
            setCurrentUser(user);
            return user;
        } catch (error) {
            console.error('AuthContext: Failed to fetch current user.', error);
            
            // Only clear auth if it's a 401 error (invalid token)
            if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
                console.log('Token invalid, clearing authentication');
                localStorage.removeItem('accessToken');
                setAccessToken(null);
                setCurrentUser(null);
            }
            
            throw error;
        }
    }, []);

    useEffect(() => {
        const bootstrapAuth = async () => {
            console.log('🔄 AuthContext: Bootstrapping authentication...');
            setLoading(true);
            
            const token = localStorage.getItem('accessToken');
            
            if (token) {
                try {
                    console.log('🔑 AuthContext: Found existing token, validating...');
                    await fetchCurrentUser(token);
                    console.log('✅ AuthContext: Token valid, user authenticated');
                } catch (error) {
                    console.log('❌ AuthContext: Token validation failed, user will need to login');
                    // Error already handled in fetchCurrentUser
                }
            } else {
                console.log('🚫 AuthContext: No token found, user not authenticated');
            }
            
            setLoading(false);
            setInitializationComplete(true);
            console.log('✅ AuthContext: Initialization complete');
        };
        
        bootstrapAuth();
    }, [fetchCurrentUser]);
    
    const login = async (email, password) => {
        console.log('🔐 AuthContext: Attempting login...');
        setLoading(true);
        
        try {
            // 1. Get the token from the API
            const data = await authApi.login(email, password);
            console.log('✅ AuthContext: Login successful, storing token...');
            
            localStorage.setItem('accessToken', data.access_token);
            setAccessToken(data.access_token);

            // 2. Fetch user data with the new token
            await fetchCurrentUser(data.access_token);
            console.log('✅ AuthContext: User data loaded successfully');
            
        } catch (error) {
            console.error('❌ AuthContext: Login failed:', error);
            setLoading(false);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        console.log('🚪 AuthContext: Logging out...');
        localStorage.removeItem('accessToken');
        setAccessToken(null);
        setCurrentUser(null);
    };

    const value = {
        accessToken,
        isAuthenticated: !!currentUser && !!accessToken,
        currentUser,
        loading,
        initializationComplete, // New flag to indicate auth system is ready
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
export default AuthContext;

