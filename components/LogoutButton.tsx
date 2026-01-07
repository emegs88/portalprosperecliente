'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ 
      redirect: false,
      callbackUrl: '/' 
    })
    router.push('/')
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="text-white hover:bg-red-600/20 hover:text-red-400"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sair
    </Button>
  )
}
