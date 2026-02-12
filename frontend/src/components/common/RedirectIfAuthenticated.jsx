import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RedirectIfAuthenticated = () => {
    const { user, loading, role } = useAuth();

    if (loading) {
        return <div className="app-loader-center">Loading...</div>;
    }

    if (user) {
        if (role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        return <Navigate to="/user/dashboard" replace />;
    }

    return <Outlet />;
};

export default RedirectIfAuthenticated;
