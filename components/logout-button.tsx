'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/signout')
      if (response.ok) {
        router.push('/login')
        router.refresh()
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
