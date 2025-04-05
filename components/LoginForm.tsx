'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-mono text-zinc-400">
          Email
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
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-mono text-zinc-400">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md bg-zinc-900/50 border border-zinc-800 
                     px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:border-green-500 
                     focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
          placeholder="••••••••"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link
            href="/signup"
            className="font-mono text-green-500 hover:text-green-400"
          >
            Need an account?
          </Link>
        </div>
        <div className="text-sm">
          <Link
            href="/forgot-password"
            className="font-mono text-zinc-400 hover:text-zinc-300"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent 
                 rounded-md shadow-sm text-sm font-mono text-black bg-green-500 
                 hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 
                 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
} 