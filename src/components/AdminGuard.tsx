import React, { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { PageLoader } from './PageLoader';
import { AlertCircle, Eye, EyeOff, Lock, Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

const ADMIN_EMAIL = 'contact@proleadventures.com';
const ADMIN_VERIFIED_SESSION_KEY = 'prole-admin-verified';

/**
 * Wraps admin-only routes. Redirects to /login if not authenticated,
 * or back to home if not the admin.
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [isAdminVerified, setIsAdminVerified] = useState(
    () => sessionStorage.getItem(ADMIN_VERIFIED_SESSION_KEY) === 'true'
  );

  const handleVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase || !user?.email || !password) {
      setVerificationError('Enter your admin password to continue.');
      return;
    }

    setVerifying(true);
    setVerificationError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (error) {
        setVerificationError('The admin password was not accepted.');
        return;
      }

      sessionStorage.setItem(ADMIN_VERIFIED_SESSION_KEY, 'true');
      setPassword('');
      setIsAdminVerified(true);
    } catch {
      setVerificationError('Unable to verify admin access. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

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

  if (!isAdminVerified) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="glass-elevated p-8 rounded-3xl border border-red-500/20 shadow-glass max-w-md w-full">
          <div className="w-16 h-16 bg-red-950/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-50 text-center mb-3">Admin Verification Required</h1>
          <p className="text-sm text-neutral-400 text-center leading-relaxed mb-6">
            Your shop account is signed in. Confirm the admin password to open Adventure Control for this browser session.
          </p>

          {verificationError && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">{verificationError}</p>
            </div>
          )}

          <form onSubmit={handleVerification} className="space-y-5">
            <div>
              <label htmlFor="admin-password" className="block text-neutral-300 text-sm font-medium mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  autoComplete="current-password"
                  autoFocus
                  required
                  className="w-full px-4 py-3 pr-12 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(current => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={verifying || !password}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-red-600 hover:bg-red-500 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-300"
            >
              {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              {verifying ? 'VERIFYING...' : 'UNLOCK ADMIN'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
