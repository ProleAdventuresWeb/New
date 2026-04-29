import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { PageLoader } from './PageLoader';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps protected routes. Redirects to /login if not authenticated.
 * Preserves the intended destination so login can redirect back.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
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

  return <>{children}</>;
};
