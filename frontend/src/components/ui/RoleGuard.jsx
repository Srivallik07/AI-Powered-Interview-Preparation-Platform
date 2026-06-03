import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const RoleGuard = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--accent-primary)', fontSize: '20px', fontFamily: 'var(--font-heading)', fontWeight: 'bold' }}>Loading interview portal...</div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page but save the target path
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User role is not permitted, redirect to user dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
export default RoleGuard;
