import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Settings, LogOut, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Head } from '../components/Head';

export const AccountPage: React.FC = () => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [saving, setSaving] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleSaveName = async () => {
    setSaving(true);
    await updateProfile({ display_name: displayName });
    setEditingName(false);
    setSaving(false);
  };

  const menuItems = [
    { icon: Package, label: 'Orders', description: 'View order history & tracking', path: '/account/orders' },
    { icon: MapPin, label: 'Addresses', description: 'Manage shipping addresses', path: '/account/addresses' },
    { icon: Settings, label: 'Settings', description: 'Account preferences', path: '/account/settings' },
  ];

  return (
    <div className="pt-24 min-h-screen bg-black">
      <Head title="Account" description="Your Prole Adventures account dashboard." />

      <div className="max-w-4xl mx-auto px-4 pb-24">
        {/* Header */}
        <div className="glass-base rounded-2xl p-8 border border-red-500/10 shadow-investigation mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-50 text-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {saving ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setDisplayName(profile?.display_name || ''); }}
                    className="px-4 py-2 bg-neutral-800 text-neutral-400 rounded-lg text-sm transition-colors hover:text-neutral-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-2xl font-bold text-neutral-50 truncate">
                    {profile?.display_name || 'Agent'}
                  </h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-neutral-600 hover:text-neutral-400 text-xs transition-colors"
                  >
                    edit
                  </button>
                </div>
              )}
              <p className="text-neutral-500 text-sm mt-1 truncate">{user?.email}</p>
              <p className="text-neutral-700 text-xs font-mono mt-1">
                OPERATIVE SINCE {new Date(user?.created_at || '').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-3 mb-8">
          {menuItems.map(({ icon: Icon, label, description, path }) => (
            <Link
              key={path}
              to={path}
              className="flex items-center gap-4 p-5 glass-subtle rounded-xl border border-red-500/5 hover:border-red-500/20 transition-all duration-300 group"
            >
              <div className="w-10 h-10 bg-neutral-800 group-hover:bg-red-500/10 rounded-lg flex items-center justify-center transition-colors">
                <Icon className="w-5 h-5 text-neutral-400 group-hover:text-red-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-neutral-50 font-medium">{label}</p>
                <p className="text-neutral-500 text-sm">{description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <Link
            to="/shop"
            className="flex items-center gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-red-500/20 transition-colors"
          >
            <Shield className="w-5 h-5 text-red-400" />
            <span className="text-neutral-300 text-sm">Browse Artefacts</span>
          </Link>
          <Link
            to="/prole-control"
            className="flex items-center gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-red-500/20 transition-colors"
          >
            <Shield className="w-5 h-5 text-red-400" />
            <span className="text-neutral-300 text-sm">Prole Control</span>
          </Link>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-5 py-3 text-neutral-500 hover:text-red-400 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
};
