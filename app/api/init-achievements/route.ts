import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aupfufxxvbwmdiewjeka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cGZ1Znh4dmJ3bWRpZXdqZWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTcwMDcsImV4cCI6MjA1OTA5MzAwN30.Z8TzJVMdmOKnOa-tbbQmsOIln3MPjHpuZu6_f6VlZmY';

// Initial achievements data
const initialAchievements = [
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'Joined during beta phase',
    icon: '🌟',
    rank: 'rare',
    points: 250,
    requires_progress: false
  },
  {
    id: 'artist',
    name: 'Digital Artist',
    description: 'Create artwork in the Draw section',
    icon: '🎨',
    rank: 'basic',
    points: 75,
    requires_progress: false
  },
  {
    id: 'spray-master',
    name: 'Spray Master',
    description: 'Use the spray tool to create art',
    icon: '🖌️',
    rank: 'uncommon',
    points: 100,
    requires_progress: false
  },
  {
    id: 'daily-streak-7',
    name: 'Weekly Warrior',
    description: 'Log in for 7 consecutive days',
    icon: '📅',
    rank: 'uncommon',
    points: 150,
    requires_progress: true,
    total_required: 7
  }
];

export async function GET() {
  try {
    // Create Supabase client with service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Initialize achievements table
    const { error: achievementsError } = await supabase
      .from('achievements')
      .upsert(initialAchievements, {
        onConflict: 'id'
      });
      
    if (achievementsError) {
      return NextResponse.json({
        status: 'error',
        message: 'Error initializing achievements',
        error: achievementsError.message
      }, { status: 500 });
    }

    // Test achievement earning
    const testWallet = 'test_wallet_123';
    
    // Create test user if doesn't exist
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        wallet_address: testWallet,
        display_name: 'Test User',
        created_at: new Date().toISOString(),
        level: 1,
        total_points: 0
      });

    if (userError) {
      return NextResponse.json({
        status: 'error',
        message: 'Error creating test user',
        error: userError.message
      }, { status: 500 });
    }

    // Award the 'artist' achievement to test user
    const { error: awardError } = await supabase
      .from('user_achievements')
      .upsert({
        wallet_address: testWallet,
        achievement_id: 'artist',
        earned_at: new Date().toISOString()
      });

    if (awardError) {
      return NextResponse.json({
        status: 'error',
        message: 'Error awarding achievement',
        error: awardError.message
      }, { status: 500 });
    }

    // Verify the points were added correctly
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('total_points, level')
      .eq('wallet_address', testWallet)
      .single();

    if (userDataError) {
      return NextResponse.json({
        status: 'error',
        message: 'Error fetching user data',
        error: userDataError.message
      }, { status: 500 });
    }

    // Verify achievements were stored
    const { data: achievements, error: verifyError } = await supabase
      .from('achievements')
      .select('*');

    if (verifyError) {
      return NextResponse.json({
        status: 'error',
        message: 'Error verifying achievements',
        error: verifyError.message
      }, { status: 500 });
    }

    // Verify user achievements
    const { data: userAchievements, error: verifyUserAchievementsError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('wallet_address', testWallet);

    if (verifyUserAchievementsError) {
      return NextResponse.json({
        status: 'error',
        message: 'Error verifying user achievements',
        error: verifyUserAchievementsError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Achievements initialized and tested successfully',
      data: {
        achievements: achievements,
        testUser: {
          wallet: testWallet,
          points: userData.total_points,
          level: userData.level,
          earnedAchievements: userAchievements
        }
      }
    });

  } catch (error) {
    console.error('Error in achievement initialization:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 