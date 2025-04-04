import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export const createClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies()
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: Omit<ResponseCookie, 'name' | 'value'>) {
          const cookieStore = await cookies()
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting error
          }
        },
        async remove(name: string, options: Omit<ResponseCookie, 'name' | 'value'>) {
          const cookieStore = await cookies()
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie deletion error
          }
        },
      },
    }
  )
}