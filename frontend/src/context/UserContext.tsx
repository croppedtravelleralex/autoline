import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'admin' | 'operator' | 'observer';

export interface User {
    username: string;
    role: UserRole;
    token?: string;
}

interface UserContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    bypassLogin: (username: string, role: UserRole) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    checkPermission: (requiredRole: UserRole) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const API_THREAD = '/api';

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    // Persist login state
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed);
                // 这里可以添加 token 有效性验证逻辑
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const response = await fetch(`${API_THREAD}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const userData = await response.json();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const bypassLogin = (username: string, role: UserRole) => {
        const userData: User = {
            username,
            role,
            token: `mock-token-${Date.now()}`
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const checkPermission = (requiredRole: UserRole): boolean => {
        if (!user) return false;
        if (user.role === 'admin') return true; // Admin has all permissions
        if (requiredRole === 'observer') return true; // Everyone is at least observer
        if (user.role === 'operator' && requiredRole === 'operator') return true;
        return false;
    };

    const value = {
        user,
        login,
        bypassLogin,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        checkPermission
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
