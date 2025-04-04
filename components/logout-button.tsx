'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/signout')
      if (response.ok) {
        // Get the current origin or use the production URL as fallback
        const baseUrl = window.location.origin || 'https://greenback-eight.vercel.app'
        window.location.href = `${baseUrl}/login`
      }
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
