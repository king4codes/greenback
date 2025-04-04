'use client';

import { createClient } from '@supabase/supabase-js';
import { useWalletStatus } from '../solana/hooks';

// Initialize Supabase client with hardcoded values since environment variables aren't loading properly
const supabaseUrl = 'https://aupfufxxvbwmdiewjeka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cGZ1Znh4dmJ3bWRpZXdqZWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTcwMDcsImV4cCI6MjA1OTA5MzAwN30.Z8TzJVMdmOKnOa-tbbQmsOIln3MPjHpuZu6_f6VlZmY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthState {
  isAuthenticated: boolean;
  currentWalletAddress: string | null;
  loading: boolean;
  error: string | null;
}

export const useSupabaseAuth = () => {
  const { address, connected, signMessage } = useWalletStatus();

  // Check if user is authenticated with Supabase
  const checkAuth = async (): Promise<AuthState> => {
    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return {
          isAuthenticated: false,
          currentWalletAddress: null,
          loading: false,
          error: error.message
        };
      }
      
      if (!session) {
        return {
          isAuthenticated: false,
          currentWalletAddress: null,
          loading: false,
          error: null
        };
      }
      
      return {
        isAuthenticated: true,
        currentWalletAddress: session.user?.id || null,
        loading: false,
        error: null
      };
      
    } catch (err) {
      console.error("Error checking auth:", err);
      return {
        isAuthenticated: false,
        currentWalletAddress: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  };

  // Simple wallet authentication without complex encoding
  const signInWithWallet = async (): Promise<{ success: boolean; error?: string }> => {
    if (!connected || !address) {
      return { success: false, error: 'Wallet not connected' };
    }
    
    try {
      // Simple direct authentication using wallet address
      // First, try to sign in with existing record
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${address}@wallet.auth`, // Virtual email
        password: `wallet-auth-${address}`, // Simple password based on wallet address
      });
      
      // If user doesn't exist, create them
      if (signInError) {
        console.log('User does not exist, creating account');
        
        // Create a new user
        const { error: signUpError } = await supabase.auth.signUp({
          email: `${address}@wallet.auth`,
          password: `wallet-auth-${address}`,
        });
        
        if (signUpError) {
          return { success: false, error: signUpError.message };
        }
        
        // Create user record
        const { error: userError } = await supabase
          .from('users')
          .insert({
            wallet_address: address,
            display_name: `User_${address.substring(0, 6)}`,
          });
          
        if (userError) {
          console.error('Error creating user record:', userError);
        }
        
        // Unlock wallet-connected achievement
        const { error: achievementError } = await supabase
          .from('user_achievements')
          .insert({
            wallet_address: address,
            achievement_id: 'wallet-connected',
          });
          
        if (achievementError) {
          console.error('Error unlocking achievement:', achievementError);
        }
      } else {
        // Update last login
        const { error: updateError } = await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('wallet_address', address);
          
        if (updateError) {
          console.error('Error updating last login:', updateError);
        }
      }
      
      return { success: true };
      
    } catch (err) {
      console.error('Error signing in with wallet:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  };

  // Sign out
  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
      
    } catch (err) {
      console.error('Error signing out:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  };

  return {
    checkAuth,
    signInWithWallet,
    signOut
  };
};

// Server-side helper to create Supabase client
export const createServerSupabaseClient = () => {
  // Use hardcoded values since env vars aren't loading properly
  return createClient(
    supabaseUrl,
    supabaseAnonKey
  );
}; 