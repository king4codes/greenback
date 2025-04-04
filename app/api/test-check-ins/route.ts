import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Step 1: Check configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Step 2: Initialize client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 3: Try to get version
    const { data: versionData, error: versionError } = await supabase
      .rpc('version');

    if (versionError) {
      console.error('Error getting version:', versionError);
      throw versionError;
    }

    return NextResponse.json({
      status: 'success',
      message: 'Version retrieved',
      data: {
        version: versionData,
        config: {
          url: supabaseUrl,
          key_prefix: supabaseServiceKey.substring(0, 10)
        }
      }
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Error in test endpoint',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}