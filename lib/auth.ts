'use client';

import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  display_name: string;
  avatar_url?: string;
  level: number;
  total_points: number;
  created_at: string;
  last_login: string;
  is_admin: boolean;
}

export interface UserStats {
  achievements: number;
  streak: number;
  rank: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`);
        }

        if (session?.user) {
          // Get user profile data
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            if (profileError.code === 'PGRST116') {
              // No profile found, create one
              const { data: newProfile, error: createError } = await supabase
                .from('users')
                .insert([{
                  id: session.user.id,
                  display_name: session.user.email?.split('@')[0] || 'Anonymous',
                  level: 1,
                  total_points: 0,
                  created_at: new Date().toISOString(),
                  last_login: new Date().toISOString()
                }])
                .select()
                .single();

              if (createError) {
                throw new Error(`Error creating profile: ${createError.message}`);
              }

              setUser(newProfile);
            } else {
              throw new Error(`Profile error: ${profileError.message}`);
            }
          } else {
            setUser(profile);
          }
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.error('Auth error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            // Get user profile
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              if (profileError.code === 'PGRST116') {
                // No profile found, create one
                const { data: newProfile, error: createError } = await supabase
                  .from('users')
                  .insert([{
                    id: session.user.id,
                    display_name: session.user.email?.split('@')[0] || 'Anonymous',
                    level: 1,
                    total_points: 0,
                    created_at: new Date().toISOString(),
                    last_login: new Date().toISOString()
                  }])
                  .select()
                  .single();

                if (createError) {
                  throw new Error(`Error creating profile: ${createError.message}`);
                }

                setUser(newProfile);
              } else {
                throw new Error(`Profile error: ${profileError.message}`);
              }
            } else {
              // Update last login
              await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', session.user.id);

              setUser(profile);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        } catch (err: any) {
          console.error('Auth state change error:', err);
          setError(err.message);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      setError(null);

      // Create auth user with email/password
      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!newUser) throw new Error('Failed to create user');

      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: newUser.id,
            display_name: displayName,
            level: 1,
            total_points: 0,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      setUser(profile);
      return profile;
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { display_name?: string; avatar_url?: string }) => {
    try {
      setLoading(true);
      setError(null);

      if (!user) throw new Error('No user logged in');

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh user data
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setUser(profile);
      return profile;
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async (newEmail: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.updateUser({
        email: newEmail,
        password: password
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Email update error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async (walletAddress: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check if wallet is already connected to another account
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('user_id')
        .eq('wallet_address', walletAddress)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError;
      }

      if (existingUser) {
        throw new Error('This wallet is already connected to another account');
      }

      // Update user profile with wallet address
      const { error: updateError } = await supabase
        .from('users')
        .update({ wallet_address: walletAddress })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Refresh user data
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      setUser(profile);
      return profile;
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserStats = async (userId: string): Promise<UserStats> => {
    try {
      // Get achievement count
      const { count: achievementCount } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Get current streak
      const { data: streakData } = await supabase
        .from('daily_checkins')
        .select('streak_count')
        .eq('user_id', userId)
        .order('check_date', { ascending: false })
        .limit(1)
        .single();

      // Calculate rank based on points
      const { data: userData } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', userId)
        .single();

      let rank = 'Novice';
      const points = userData?.total_points || 0;
      
      if (points >= 10000) rank = 'Master';
      else if (points >= 5000) rank = 'Expert';
      else if (points >= 1000) rank = 'Advanced';
      else if (points >= 100) rank = 'Intermediate';

      return {
        achievements: achievementCount || 0,
        streak: streakData?.streak_count || 0,
        rank
      };
    } catch (err) {
      console.error('Error getting user stats:', err);
      return {
        achievements: 0,
        streak: 0,
        rank: 'Novice'
      };
    }
  };

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    connectWallet,
    getUserStats,
    updateProfile,
    updateEmail
  };
} 