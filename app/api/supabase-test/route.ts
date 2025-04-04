import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials since env vars aren't loading properly
const supabaseUrl = 'https://aupfufxxvbwmdiewjeka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cGZ1Znh4dmJ3bWRpZXdqZWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTcwMDcsImV4cCI6MjA1OTA5MzAwN30.Z8TzJVMdmOKnOa-tbbQmsOIln3MPjHpuZu6_f6VlZmY';

export async function GET() {
  try {
    // Initialize Supabase client with hardcoded values
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Testing Supabase connection with hardcoded values');
    
    // Test query to check connection
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (error) {
      // If users table doesn't exist, it might mean tables haven't been created
      if (error.message.includes('relation "users" does not exist')) {
        return NextResponse.json({
          status: 'error',
          message: 'The users table does not exist. Please run the SQL scripts to create your database tables.',
          error: error.message
        }, { status: 404 });
      }
      
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Connected to Supabase successfully',
      tableData: {
        usersFound: Array.isArray(data) ? data.length : 0,
        usersData: data || []
      }
    });
    
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Supabase', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 