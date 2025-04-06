'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/MainLayout'
import SettingsForm from '@/components/SettingsForm'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase-browser'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading, error, refreshUserProfile } = useAuth()
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking session in settings page...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }

        if (!session) {
          console.log('No session found, redirecting to login...')
          router.push('/login')
          return
        }

        console.log('Session found, continuing to settings page')
      } catch (err: any) {
        console.error('Session check error:', err)
        setSessionError(err.message)
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [router])

  // Show loading state while checking session or auth loading
  if (isCheckingSession || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication status...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Show error state
  if (sessionError || error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-red-600">
            <p>Error: {sessionError || error}</p>
            <button 
              onClick={() => router.push('/login')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Return to Login
            </button>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Show settings form only if user is authenticated
  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Please log in to access settings.</p>
            <button 
              onClick={() => router.push('/login')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>
        <SettingsForm onUpdate={refreshUserProfile} />
      </div>
    </MainLayout>
  )
} 