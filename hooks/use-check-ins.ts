'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth';

interface CheckInData {
  lastCheckIn: string | null;
  streak: number;
  canCheckInToday: boolean;
  totalCheckins: number;
}

export function useCheckIns() {
  const { user } = useAuth();
  const [checkInData, setCheckInData] = useState<CheckInData>({
    lastCheckIn: null,
    streak: 0,
    canCheckInToday: false,
    totalCheckins: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch check-in data from Supabase
  const fetchCheckInData = useCallback(async () => {
    if (!user?.id) {
      setCheckInData({
        lastCheckIn: null,
        streak: 0,
        canCheckInToday: false,
        totalCheckins: 0
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if user has checked in today
      const today = new Date().toISOString().split('T')[0];

      const { data: todayCheckIns, error: todayError } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('check_in_date', today)
        .order('created_at', { ascending: false })
        .limit(1);

      if (todayError) {
        throw new Error('Error checking today\'s check-in: ' + todayError.message);
      }

      const todayCheckIn = todayCheckIns?.[0];

      // Get the latest check-in to determine streak
      const { data: latestCheckIns, error: latestError } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('check_in_date', { ascending: false })
        .limit(1);

      if (latestError) {
        throw new Error('Error fetching latest check-in: ' + latestError.message);
      }

      const latestCheckIn = latestCheckIns?.[0];

      // Count total check-ins
      const { count: totalCheckins, error: countError } = await supabase
        .from('daily_checkins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        throw new Error('Error counting check-ins: ' + countError.message);
      }

      const canCheckInToday = !todayCheckIn;
      const lastCheckIn = latestCheckIn?.check_in_date || null;
      const streak = latestCheckIn?.streak_count || 0;

      setCheckInData({
        lastCheckIn,
        streak,
        canCheckInToday,
        totalCheckins: totalCheckins || 0
      });
    } catch (err) {
      console.error('Error fetching check-in data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase]);

  // Perform daily check-in
  const checkIn = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setError('Please sign in to check in');
      return false;
    }

    if (!checkInData.canCheckInToday) {
      setError('Already checked in today');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate if this is continuing a streak
      let newStreak = 1; // Default to starting a new streak
      
      if (checkInData.lastCheckIn) {
        const lastDate = new Date(checkInData.lastCheckIn);
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split('T')[0];
        
        if (checkInData.lastCheckIn === yesterday) {
          // Continuing streak
          newStreak = checkInData.streak + 1;
        }
      }
      
      // Calculate points (more for longer streaks)
      const basePoints = 10;
      const streakBonus = Math.min(newStreak * 2, 50); // Cap streak bonus at 50
      const totalPoints = basePoints + streakBonus;
      
      // Insert check-in
      const { error: checkInError } = await supabase
        .from('daily_checkins')
        .insert({
          user_id: user.id,
          check_in_date: today,
          streak_count: newStreak,
          points_earned: totalPoints
        });

      if (checkInError) {
        throw new Error('Error inserting check-in: ' + checkInError.message);
      }
      
      // Update user's total points
      const { error: pointsError } = await supabase
        .from('users')
        .update({ total_points: totalPoints })
        .eq('id', user.id)
        .select()
        .single();
      
      if (pointsError) {
        console.error('Error incrementing points:', pointsError);
      }
      
      // Check for streak achievements
      if (newStreak >= 7) {
        await unlockStreakAchievement(user.id, 'daily-streak-7');
      }
      
      if (newStreak >= 30) {
        await unlockStreakAchievement(user.id, 'daily-streak-30');
      }
      
      if (newStreak >= 365) {
        await unlockStreakAchievement(user.id, 'daily-streak-365');
      }
      
      // Refresh check-in data
      await fetchCheckInData();
      
      return true;
    } catch (err) {
      console.error('Error checking in:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, checkInData, fetchCheckInData, supabase]);

  // Helper to unlock streak achievements
  const unlockStreakAchievement = async (userId: string, achievementId: string) => {
    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          progress: 100
        })
        .single();

      if (error && !error.message.includes('duplicate key')) {
        console.error('Error unlocking achievement:', error);
      }
    } catch (err) {
      console.error('Error in unlockStreakAchievement:', err);
    }
  };

  // Fetch check-in data when user changes
  useEffect(() => {
    fetchCheckInData();
  }, [user?.id, fetchCheckInData]);

  return {
    ...checkInData,
    loading,
    error,
    checkIn,
    refresh: fetchCheckInData
  };
} 