import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()

  // Sign out on the server
  await supabase.auth.signOut()

  // Get the base URL from the request or environment variable
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'https://greenback-eight.vercel.app'

  // Clear auth cookies by setting them to expire immediately
  const response = NextResponse.redirect(new URL('/login', baseUrl))
  response.cookies.set('sb-access-token', '', { maxAge: 0 })
  response.cookies.set('sb-refresh-token', '', { maxAge: 0 })

  return response
} 