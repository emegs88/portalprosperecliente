'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email) {
      setError('Por favor, informe um email')
      return
    }

    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password: 'temp', // Valor qualquer, não será verificado
        redirect: false,
      })

      if (result?.error) {
        console.error('Erro de login:', result.error)
        setError('Erro ao fazer login: ' + result.error)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('Erro:', error)
      setError('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-600 bg-white">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <Logo size="lg" />
          </div>
          <div className="mb-4">
            <p className="text-red-600 text-sm font-semibold mb-2">Portal do Cliente</p>
          </div>
          <CardTitle className="text-2xl text-gray-900">Bem-vindo de volta</CardTitle>
          <CardDescription className="text-gray-600">Entre com suas credenciais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            {/* Campo senha removido temporariamente */}
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
