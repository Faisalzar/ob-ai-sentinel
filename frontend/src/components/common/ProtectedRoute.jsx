import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protects nested routes based on authentication and optional role.
 * usage:
 * <Route element={<ProtectedRoute allowedRoles={['user','admin']} />}> ... </Route>
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, role, maintenanceMode } = useAuth();

  if (loading) {
    return <div className="app-loader-center">Loading...</div>;
  }

  // Enforce Maintenance Mode: only admins can pass if active
  if (maintenanceMode && role !== 'admin') {
    return <Navigate to="/maintenance" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // redirect non-admin users away from admin routes, etc.
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
