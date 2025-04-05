'use client'

import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase-browser'

export default function LogoutButton() {
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

  return (
    <Button 
      variant="ghost" 
      onClick={handleLogout}
      className="text-zinc-400 hover:text-zinc-100"
    >
      Sign Out
    </Button>
  )
}
