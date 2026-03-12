import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dbService } from '../services/db';
import { Usuario } from '../types/database';

interface AuthContextType {
    user: Usuario | null;
    login: (id: number, pin: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('activeUser');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (id: number, pin: string) => {
        try {
            const result = await dbService.select<Usuario>(
                'SELECT id, nombre, rol FROM usuarios WHERE id = ? AND pin = ?',
                [id, pin]
            );

            if (result.length > 0) {
                const loggedUser = result[0];
                setUser(loggedUser);
                localStorage.setItem('activeUser', JSON.stringify(loggedUser));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('activeUser');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
