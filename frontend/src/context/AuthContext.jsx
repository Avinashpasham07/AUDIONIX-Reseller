import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('/auth/me');
                    // Backend returns user object directly, not wrapped in 'data'
                    setUser(data);
                } catch (error) {
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (email, password) => {
        console.log("Attempting login for:", email);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            console.log("Login success:", data);
            localStorage.setItem('token', data.token);
            const profile = await api.get('/auth/me');
            console.log("User Profile Fetched:", profile.data);
            setUser(profile.data); // Fixed: Removed .data
            return data;
        } catch (error) {
            console.error("AuthContext Login Error:", error);
            throw error;
        }
    };

    const register = async (userData) => {
        const { data } = await api.post('/auth/register', userData);
        if (data.token && data.accountStatus !== 'pending') {
            localStorage.setItem('token', data.token);
            const profile = await api.get('/auth/me');
            setUser(profile.data);
        }
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
