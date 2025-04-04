import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the hardcoded credentials since env vars aren't loading properly
const supabaseUrl = 'https://aupfufxxvbwmdiewjeka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cGZ1Znh4dmJ3bWRpZXdqZWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTcwMDcsImV4cCI6MjA1OTA5MzAwN30.Z8TzJVMdmOKnOa-tbbQmsOIln3MPjHpuZu6_f6VlZmY';

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test 1: Check if achievements table exists and has data
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*');
      
    if (achievementsError) {
      return NextResponse.json({
        status: 'error',
        message: 'Error fetching achievements',
        error: achievementsError.message
      }, { status: 500 });
    }

    // Test 2: Check if user_achievements table exists
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('*')
      .limit(5);

    if (userAchievementsError) {
      return NextResponse.json({
        status: 'error',
        message: 'Error fetching user achievements',
        error: userAchievementsError.message
      }, { status: 500 });
    }

    // Test 3: Check if points are being calculated correctly
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('wallet_address, total_points, level')
      .limit(5);

    if (usersError) {
      return NextResponse.json({
        status: 'error',
        message: 'Error fetching users',
        error: usersError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      data: {
        achievements: {
          count: achievements?.length || 0,
          items: achievements
        },
        userAchievements: {
          count: userAchievements?.length || 0,
          items: userAchievements
        },
        users: {
          count: users?.length || 0,
          items: users
        }
      }
    });

  } catch (error) {
    console.error('Error testing achievements:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 