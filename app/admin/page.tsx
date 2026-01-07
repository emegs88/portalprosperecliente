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

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?next=/admin')
    } else if (status === 'authenticated' && session?.user) {
      // Verificar se tem role de admin
      const userRole = (session.user as any).role
      if (userRole && userRole !== 'admin' && userRole !== 'ADMIN') {
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
            <CardTitle className="text-2xl text-white">Área Administrativa Prospere</CardTitle>
            <p className="text-gray-400">Painel administrativo em desenvolvimento</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-300">
                Bem-vindo, <strong>{session.user?.name}</strong>!
              </p>
              <p className="text-gray-400">
                Esta é a área administrativa. Aqui você pode:
              </p>
              <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
                <li>Cadastrar novos clientes</li>
                <li>Importar extratos de cotas</li>
                <li>Gerenciar usuários</li>
                <li>Visualizar relatórios administrativos</li>
              </ul>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/admin/cadastrar-cliente">
                  <Button className="w-full bg-[#E30613] hover:bg-[#E30613]/90 text-white h-20 flex flex-col items-center justify-center">
                    <span className="text-lg font-semibold">Cadastrar Cliente</span>
                    <span className="text-sm opacity-80">Novo cadastro manual</span>
                  </Button>
                </Link>
                <Link href="/admin/importar">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-20 flex flex-col items-center justify-center">
                    <span className="text-lg font-semibold">Importar Extrato</span>
                    <span className="text-sm opacity-80">PDF ou Excel com OCR</span>
                  </Button>
                </Link>
                <Link href="/upload-cadastro">
                  <Button variant="outline" className="w-full text-white border-red-600/50 hover:bg-red-600/20 h-20 flex flex-col items-center justify-center">
                    <span className="text-lg font-semibold">Upload Rápido</span>
                    <span className="text-sm opacity-80">Upload com senha admin</span>
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
