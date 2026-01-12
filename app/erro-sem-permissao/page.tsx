'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo/Logo'
import { ShieldX, ArrowLeft, Home } from 'lucide-react'

export default function ErroSemPermissaoPage() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Se não estiver autenticado, redirecionar para login
    if (!session) {
      router.push('/login')
    }
  }, [session, router])

  const userRole = (session?.user as any)?.role

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-red-600/20">
            <Logo size="lg" />
            <p className="text-white text-center mt-4 text-sm font-semibold">Portal do Cliente</p>
          </div>
        </div>

        {/* Card de erro */}
        <Card className="w-full border-red-600/50 bg-black/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-white font-bold">
              Acesso Negado
            </CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              Você não tem permissão para acessar essa área
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <p className="text-red-200 text-center">
                Sua conta ({userRole === 'client' ? 'Cliente' : userRole || 'Usuário'}) não possui 
                permissões administrativas para acessar esta área.
              </p>
              {userRole === 'client' && (
                <p className="text-gray-300 text-center mt-2 text-sm">
                  Para acessar a área administrativa, você precisa de uma conta com permissões de administrador.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/dashboard">
                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white">
                  <Home className="h-4 w-4 mr-2" />
                  Ir para Dashboard
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto text-white border-red-600/50 hover:bg-red-600/20">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Home
                </Button>
              </Link>
            </div>

            {session && (
              <div className="pt-4 border-t border-gray-700">
                <p className="text-gray-400 text-sm text-center">
                  Logado como: <span className="text-white font-semibold">{session.user?.email}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
