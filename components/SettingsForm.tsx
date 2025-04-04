'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function SettingsForm() {
  const { user, updateProfile, updateEmail } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<'profile' | 'email'>('profile');

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await updateProfile({ display_name: displayName });
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await updateEmail(email, currentPassword);
      setSuccess('Email update initiated. Please check your new email for confirmation.');
      setEmail('');
      setCurrentPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-zinc-800 pb-4">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveForm('profile')}
            className={`pb-4 -mb-4 text-sm font-mono ${
              activeForm === 'profile'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Profile Settings
          </button>
          <button
            onClick={() => setActiveForm('email')}
            className={`pb-4 -mb-4 text-sm font-mono ${
              activeForm === 'email'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Email Settings
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-green-500 text-sm">{success}</p>
        </div>
      )}

      {activeForm === 'profile' ? (
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-mono text-zinc-400">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md bg-zinc-900/50 border border-zinc-800 
                       px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:border-green-500 
                       focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent 
                     rounded-md shadow-sm text-sm font-mono text-black bg-green-500 
                     hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleEmailUpdate} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-mono text-zinc-400">
              New Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md bg-zinc-900/50 border border-zinc-800 
                       px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:border-green-500 
                       focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
              placeholder="new@example.com"
            />
          </div>

          <div>
            <label htmlFor="currentPassword" className="block text-sm font-mono text-zinc-400">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md bg-zinc-900/50 border border-zinc-800 
                       px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:border-green-500 
                       focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent 
                     rounded-md shadow-sm text-sm font-mono text-black bg-green-500 
                     hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 
                     focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Email'}
          </button>
        </form>
      )}
    </div>
  );
} 