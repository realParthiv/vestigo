import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if logged in (simplistic check, ideally decode token or fetch profile)
        const token = localStorage.getItem('access_token');
        // We could decode the JWT here to get the username/role instantly
        // For now, we'll assume if token exists, we are somewhat logged in
        // Real implementation: Fetch /api/v1/users/me/ or decode JWT
        if (token) {
            // Mocking user extraction from token or fetching profile
            // For MVP, letting api 401 handle invalid tokens
            setUser({ name: 'User' }); // Placeholder until we implementing /me endpoint or decode
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const response = await api.post('/auth/login/', { username, password });
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);

        // Decode token to get role/username
        // Simplification for MVP:
        const base64Url = response.data.access.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);

        setUser({
            username: payload.username,
            role: payload.role
        });
        return true;
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
