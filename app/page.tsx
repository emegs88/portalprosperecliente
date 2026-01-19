import { Logo } from '@/components/logo/Logo'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <Logo size="lg" className="justify-center" />
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">
            Portal do Cliente
          </h1>
          <p className="text-gray-300">
            Acesse seu dashboard para acompanhar suas cotas e simulações
          </p>
          <div className="pt-4 space-y-3">
            <Link href="/login" className="block">
              <Button size="lg" className="w-full">
                Entrar
              </Button>
            </Link>
            <Link href="/acessos" className="block">
              <Button variant="outline" size="lg" className="w-full">
                Acessar Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
