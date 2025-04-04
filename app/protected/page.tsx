import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import LogoutButton from '@/components/logout-button'

export default async function ProtectedPage() {
  const supabase = await createClient()
  let userData;

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return redirect('/login')
    }
    userData = user;
  } catch (error) {
    return redirect('/login')
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="animate-in flex flex-col gap-14 opacity-0 max-w-4xl px-3 py-16 lg:py-24 text-foreground">
        <div className="flex flex-col items-center mb-4 lg:mb-12">
          <h1 className="text-4xl mb-4">Protected Page</h1>
          <p>You are signed in!</p>
        </div>
      </div>
      <div className="flex h-svh w-full items-center justify-center gap-2">
        <p>
          Hello <span>{userData.email}</span>
        </p>
        <LogoutButton />
      </div>
    </div>
  )
}
