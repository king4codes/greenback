'use client'

import MainLayout from '@/components/MainLayout'
import SettingsForm from '@/components/SettingsForm'
import { useAuth } from '@/lib/auth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase-browser'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect if not signed in
  useEffect(() => {
    if (!user && !loading) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    try {
      // First sign out from Supabase client
      await supabase.auth.signOut()
      
      // Then call our API to clear cookies
      await fetch('/api/auth/signout', {
        method: 'GET',
        credentials: 'include'
      })

      // Redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-zinc-400">Loading...</div>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="font-garamond text-3xl text-green-400 mb-4">
            Account Settings
          </h1>
          <p className="text-zinc-400 font-mono text-sm">
            Manage your profile and account settings
          </p>
        </div>

        <div className="bg-zinc-800/50 rounded-lg p-8">
          <SettingsForm />
        </div>

        {/* Logout Section */}
        <div className="mt-8 bg-zinc-800/50 rounded-lg p-8">
          <h2 className="font-garamond text-xl text-green-400 mb-4">Account Actions</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-red-400 font-medium mb-1">Logout</h3>
              <p className="text-zinc-400 text-sm">Sign out of your account</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
} 