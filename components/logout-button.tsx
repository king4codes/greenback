'use client'

import { supabase } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
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
