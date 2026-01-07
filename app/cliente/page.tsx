'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Logo } from '@/components/Logo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'

export default function ClientePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?next=/cliente')
    } else if (status === 'authenticated' && session?.user) {
      // Verificar se tem role de cliente
      const userRole = (session.user as any).role
      if (userRole && userRole !== 'client' && userRole !== 'CLIENTE') {
        router.push('/?erro=sem_permissao')
      }
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="border-b border-red-600/20 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" className="text-white border-red-600/50 hover:bg-red-600/20">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-4">
                <div className="text-white">
                  <p className="text-sm">{session.user?.name}</p>
                  <p className="text-xs text-gray-400">{session.user?.email}</p>
                </div>
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="bg-black/50 border-red-600/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Área do Cliente</CardTitle>
            <p className="text-gray-400">Dashboard do cliente em desenvolvimento</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-300">
                Bem-vindo, <strong>{session.user?.name}</strong>!
              </p>
              <p className="text-gray-400">
                Esta é a área do cliente. Aqui você terá acesso a:
              </p>
              <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
                <li>Visualizar suas cotas</li>
                <li>Simular vendas</li>
                <li>Ver relatórios patrimoniais</li>
                <li>Gerenciar importações</li>
              </ul>
              <div className="mt-6">
                <Link href="/dashboard">
                  <Button className="bg-[#E30613] hover:bg-[#E30613]/90 text-white">
                    Ir para Dashboard Completo
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
