'use client';

import { createBrowserClient } from '@supabase/ssr';

// Ensure environment variables are available
declare global {
  interface Window {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      NEXT_PUBLIC_SITE_URL: string;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Get the current domain
const domain = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalhost = domain === 'localhost' || domain === '127.0.0.1';
const isVercelDomain = domain.endsWith('.vercel.app');

// Use environment variable for site URL, fallback to domain-based URL
const getSiteUrl = () => {
  if (siteUrl) return siteUrl;
  if (isLocalhost) return 'http://localhost:3000';
  if (isVercelDomain) return `https://${domain}`;
  return `https://${domain}`;
};

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    cookieOptions: {
      name: 'sb-session',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: isLocalhost ? undefined : `.${domain}`
    },
    global: {
      headers: {
        'x-site-url': getSiteUrl()
      }
    }
  }
); 