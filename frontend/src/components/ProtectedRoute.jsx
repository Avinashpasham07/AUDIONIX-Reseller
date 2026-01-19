import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ children, permission }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.accountStatus === 'blocked') {
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    // Role-based page protection for employees
    if (user.role === 'employee' && permission) {
        if (!user.permissions || !user.permissions.includes(permission)) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
