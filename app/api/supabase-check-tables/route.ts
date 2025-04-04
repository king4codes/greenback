import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials since env vars aren't loading properly
const supabaseUrl = 'https://aupfufxxvbwmdiewjeka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cGZ1Znh4dmJ3bWRpZXdqZWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTcwMDcsImV4cCI6MjA1OTA5MzAwN30.Z8TzJVMdmOKnOa-tbbQmsOIln3MPjHpuZu6_f6VlZmY';

export async function GET() {
  try {
    // Initialize Supabase client with hardcoded values
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Checking Supabase tables');
    
    // Check individual tables with proper syntax
    const tableResults: Record<string, string> = {};
    
    // Test each table by trying to select one row
    const tables = ['users', 'achievements', 'user_achievements', 'daily_checkins', 'user_nfts'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          tableResults[table] = `Error: ${error.message}`;
        } else {
          tableResults[table] = 'Exists';
        }
      } catch (err) {
        tableResults[table] = `Error: ${err instanceof Error ? err.message : String(err)}`;
      }
    }
    
    // Check if any tables exist
    const tablesExist = Object.values(tableResults).some(result => result === 'Exists');
    
    if (!tablesExist) {
      return NextResponse.json({
        status: 'error',
        message: 'No tables were found. Please run the SQL scripts to create your database tables.',
        tableStatus: tableResults
      }, { status: 404 });
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Successfully checked Supabase tables',
      tableStatus: tableResults
    });
    
  } catch (error) {
    console.error('Error checking Supabase tables:', error);
    return NextResponse.json(
      { error: 'Failed to check Supabase tables', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 