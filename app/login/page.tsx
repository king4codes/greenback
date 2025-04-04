'use client';

import MainLayout from '@/components/MainLayout';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already signed in
  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <MainLayout username="">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-zinc-400">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout username="">
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="font-garamond text-3xl text-green-400 mb-4">
            Welcome Back
          </h1>
          <p className="text-zinc-400 font-mono text-sm">
            Sign in to continue your journey
          </p>
        </div>

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
      </div>
    </MainLayout>
  );
} 