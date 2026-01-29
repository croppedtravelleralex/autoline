import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { type ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useUser();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
