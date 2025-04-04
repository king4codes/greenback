'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { usePathname } from 'next/navigation'

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rank: 'basic' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  requires_progress: boolean;
  total_required?: number;
  progress?: number;
  earned_at?: string | null;
  earned: boolean;
}

interface UserAchievement {
  achievement_id: string;
  progress: number;
  earned_at: string | null;
  achievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    rank: 'basic' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    points: number;
    requires_progress: boolean;
    total_required?: number;
  };
}

export function useAchievements() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Fetch all achievements and user progress
  const fetchAchievements = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // First fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('rank', { ascending: false });
      
      if (achievementsError) throw achievementsError;
      if (!allAchievements) throw new Error('No achievements found');

      if (user?.id) {
        // Fetch user's earned achievements
        const { data: userAchievements, error: userAchievementsError } = await supabase
          .from('user_achievements')
          .select('achievement_id, progress, earned_at')
          .eq('user_id', user.id);
        
        if (userAchievementsError) throw userAchievementsError;

        // Fetch streak data for daily achievements
        const { data: checkInData } = await supabase
          .from('daily_checkins')
          .select('streak_count')
          .eq('user_id', user.id)
          .order('check_in_date', { ascending: false })
          .limit(1)
          .single();

        const currentStreak = checkInData?.streak_count || 0;

        // Merge achievements with user progress
        const mappedAchievements = allAchievements.map(achievement => {
          const userAchievement = userAchievements?.find(ua => ua.achievement_id === achievement.id);
          
          // Special handling for streak-based achievements
          if (achievement.id.startsWith('daily-streak-')) {
            return {
              ...achievement,
              progress: currentStreak,
              earned_at: userAchievement?.earned_at,
              earned: !!userAchievement?.earned_at
            };
          }

          return {
            ...achievement,
            progress: userAchievement?.progress || 0,
            earned_at: userAchievement?.earned_at,
            earned: !!userAchievement?.earned_at
          };
        });
        
        setAchievements(mappedAchievements);
      } else {
        // If no user, show all achievements as locked
        const mappedAchievements = allAchievements.map(achievement => ({
          ...achievement,
          progress: 0,
          earned_at: null,
          earned: false
        }));
        
        setAchievements(mappedAchievements);
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  // Track chat messages for chat sapling achievement
  useEffect(() => {
    const checkChatAchievement = async () => {
      if (!user?.id || isLoading || achievements.length === 0) return;

      try {
        // Check if already earned
        const chatAchievement = achievements.find(a => a.id === 'chat-sapling');
        if (!chatAchievement || chatAchievement.earned) return;

        console.log('Checking chat sapling achievement');

        // Check if user has sent any messages
        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (messagesError) throw messagesError;

        if (messages && messages.length > 0) {
          // Earn the achievement
          await earnAchievement('chat-sapling');
          console.log('Chat Sapling achievement earned');
        }
      } catch (err) {
        console.error('Error checking chat achievement:', err);
      }
    };

    checkChatAchievement();
  }, [user?.id, achievements, isLoading]);

  // Check for early adopter achievement on login
  useEffect(() => {
    const checkEarlyAdopter = async () => {
      if (!user?.id) return;
      await earnAchievement('early-adopter');
    };

    checkEarlyAdopter();
  }, [user?.id]);

  // Update progress for an achievement
  const updateProgress = useCallback(async (
    achievementId: string, 
    newProgress: number
  ): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      setError(null);
      
      const achievement = achievements.find(a => a.id === achievementId);
      if (!achievement?.requires_progress) return false;
      
      const total = achievement.total_required || 1;
      const isComplete = newProgress >= total;
      
      const { error: progressError } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: user.id,
          achievement_id: achievementId,
          progress: newProgress,
          earned_at: isComplete ? new Date().toISOString() : null
        }, {
          onConflict: 'user_id,achievement_id'
        });
      
      if (progressError) throw progressError;
      
      // Refresh achievements list
      await fetchAchievements();
      
      return true;
    } catch (err) {
      console.error('Error updating achievement progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to update achievement progress');
      return false;
    }
  }, [user?.id, achievements, supabase, fetchAchievements]);

  // Earn an achievement
  const earnAchievement = useCallback(async (achievementId: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      setError(null);
      
      const { error: achievementError } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: user.id,
          achievement_id: achievementId,
          earned_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,achievement_id'
        });
      
      if (achievementError) throw achievementError;
      
      // Refresh achievements list
      await fetchAchievements();
      
      return true;
    } catch (err) {
      console.error('Error earning achievement:', err);
      setError(err instanceof Error ? err.message : 'Failed to earn achievement');
      return false;
    }
  }, [user?.id, supabase, fetchAchievements]);

  // Initial fetch
  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    achievements,
    isLoading,
    error,
    updateProgress,
    earnAchievement,
    fetchAchievements
  };
} 