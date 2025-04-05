'use client';

import MainLayout from '@/components/MainLayout';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Login page state:', { user, loading, error });
  }, [user, loading, error]);

  // Redirect if already signed in
  useEffect(() => {
    if (user && !loading) {
      console.log('User is signed in, redirecting to home...');
      router.push('/');
    }
  }, [user, loading, router]);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="font-garamond text-3xl text-green-400 mb-4">
            Welcome Back
          </h1>
          <p className="text-zinc-400 font-mono text-sm">
            Sign in to continue your journey
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <div className="animate-pulse text-zinc-400 mb-2">Loading...</div>
            <p className="text-sm text-zinc-500">Checking authentication status</p>
          </div>
        ) : (
          <>
            <div className="bg-zinc-800/50 rounded-lg p-8">
              <div className="flex flex-col items-center">
                <div className="w-full max-w-sm">
                  <LoginForm />
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-zinc-500">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 