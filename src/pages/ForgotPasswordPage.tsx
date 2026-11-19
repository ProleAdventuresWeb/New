import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Head } from '../components/Head';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="pt-24 min-h-screen bg-black flex items-center justify-center p-4">
        <Head title="Check Your Email" description="Password reset link sent" robots="noindex, follow" />
        <div className="max-w-md w-full glass-base rounded-2xl p-8 border border-green-500/20 shadow-investigation text-center">
          <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-neutral-50 mb-4">
            CheCK YoUR <span className="text-green-500">EMAIL</span>
          </h1>
          <p className="text-neutral-300 mb-6">
            If an account exists for <strong className="text-neutral-50">{email}</strong>,
            you'll receive a password reset link shortly.
          </p>
          <Link to="/login" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-black flex items-center justify-center p-4">
      <Head title="Forgot Password" description="Reset your Prole Adventures account password." robots="noindex, follow" />

      <div className="max-w-md w-full">
        <div className="glass-base rounded-2xl p-8 border border-red-500/10 shadow-investigation">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-7 h-7 text-red-400" />
            </div>
            <h1 className="font-display text-3xl font-bold text-neutral-50 mb-2">
              FoRGoT <span className="text-red-500">PASSWORD</span>
            </h1>
            <p className="text-neutral-400 text-sm">Enter your email and we'll send a reset link</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reset-email" className="block text-neutral-300 text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-6 bg-red-600 hover:bg-red-500 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-300"
            >
              {loading ? 'SENDING...' : 'SEND RESET LINK'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
