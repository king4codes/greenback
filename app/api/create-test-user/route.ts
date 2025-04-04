import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials since env vars aren't loading properly
const supabaseUrl = 'https://aupfufxxvbwmdiewjeka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cGZ1Znh4dmJ3bWRpZXdqZWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTcwMDcsImV4cCI6MjA1OTA5MzAwN30.Z8TzJVMdmOKnOa-tbbQmsOIln3MPjHpuZu6_f6VlZmY';

export async function GET() {
  try {
    // Initialize Supabase client with hardcoded values
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Create a test user
    const testWalletAddress = 'AzWP4Ltp9qHJCQe1Sb9wG8JANyEbuXSkRRvaMNWuBUXA';
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('wallet_address', testWalletAddress)
      .single();
      
    if (checkError && !checkError.message.includes('No rows found')) {
      return NextResponse.json({
        status: 'error',
        message: 'Error checking for existing user',
        error: checkError.message
      }, { status: 500 });
    }
    
    // If user exists, return success
    if (existingUser) {
      return NextResponse.json({
        status: 'success',
        message: 'Test user already exists',
        user: existingUser
      });
    }
    
    // Insert test user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        wallet_address: testWalletAddress,
        display_name: 'Test User',
        total_points: 150,
        level: 2,
        avatar_url: 'https://avatars.githubusercontent.com/u/1234567',
        is_admin: false
      })
      .select()
      .single();
      
    if (insertError) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to create test user',
        error: insertError.message
      }, { status: 500 });
    }
    
    // Create Supabase auth user for the test wallet
    const { error: authError } = await supabase.auth.signUp({
      email: `${testWalletAddress}@wallet.auth`,
      password: `wallet-auth-${testWalletAddress}`,
    });
    
    if (authError) {
      console.error('Warning: Could not create auth user:', authError);
    }
    
    // Add a test achievement for the user
    const { error: achievementError } = await supabase
      .from('user_achievements')
      .insert({
        wallet_address: testWalletAddress,
        achievement_id: 'wallet-connected',
        progress: 1
      });
      
    if (achievementError) {
      console.error('Error adding achievement:', achievementError);
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Test user created successfully',
      user: newUser
    });
    
  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json(
      { error: 'Failed to create test user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 