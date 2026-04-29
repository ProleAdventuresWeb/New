import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { PageLoader } from './PageLoader';

interface AdminGuardProps {
  children: React.ReactNode;
}

const ADMIN_EMAIL = 'contact@proleadventures.com';

/**
 * Wraps admin-only routes. Redirects to /login if not authenticated,
 * or back to home if not the admin.
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();

  // Still loading auth state
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-black">
        <PageLoader />
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // authenticated but not the admin
  if (user.email !== ADMIN_EMAIL) {
    console.warn(`Unauthorized access attempt to admin by: ${user.email}`);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
