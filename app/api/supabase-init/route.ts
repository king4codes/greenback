import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Basic user table creation SQL
const createUserTableSQL = `
CREATE TABLE IF NOT EXISTS public.users (
  wallet_address TEXT PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
  level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY IF NOT EXISTS users_select_policy ON public.users 
  FOR SELECT USING (auth.uid()::text = wallet_address);

-- Allow users to update their own data
CREATE POLICY IF NOT EXISTS users_update_policy ON public.users 
  FOR UPDATE USING (auth.uid()::text = wallet_address);

-- Allow users to insert their own data
CREATE POLICY IF NOT EXISTS users_insert_policy ON public.users 
  FOR INSERT WITH CHECK (auth.uid()::text = wallet_address);
`;

export async function GET() {
  try {
    // Initialize Supabase client with hardcoded values
    const supabaseUrl = 'https://aupfufxxvbwmdiewjeka.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cGZ1Znh4dmJ3bWRpZXdqZWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTcwMDcsImV4cCI6MjA1OTA5MzAwN30.Z8TzJVMdmOKnOa-tbbQmsOIln3MPjHpuZu6_f6VlZmY';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Try to run basic SQL to create users table
    const { error } = await supabase.rpc('exec_sql', { sql: createUserTableSQL });
    
    if (error) {
      // If rpc fails (which is likely without proper permissions), provide guidance
      return NextResponse.json({
        status: 'error',
        message: 'Could not automatically create tables. You need to run the SQL scripts manually.',
        error: error.message,
        instructions: 'Please run the provided SQL scripts in your Supabase SQL Editor.',
        sql: {
          userTable: createUserTableSQL
        }
      }, { status: 403 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Basic user table initialized. You should run the full script for complete schema setup.',
      instructions: 'Run the full supabase-init.sql and supabase-stored-procedures.sql files in your Supabase SQL Editor.'
    });
  } catch (error) {
    console.error('Error initializing Supabase tables:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Supabase tables', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 