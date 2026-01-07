'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Verificar se veio do cadastro
  const [cadastroSucesso, setCadastroSucesso] = useState(false)

  useEffect(() => {
    if (searchParams.get('cadastro') === 'sucesso') {
      setCadastroSucesso(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email || !email.trim()) {
      setError('Por favor, informe um email válido')
      return
    }

    if (!password) {
      setError('Por favor, informe sua senha')
      return
    }

    setLoading(true)
    setError('')

    try {
      const emailValue = email.trim().toLowerCase()
      
      // Tentar fazer login
      const result = await signIn('credentials', {
        email: emailValue,
        password: password,
        redirect: false,
        callbackUrl: '/dashboard'
      })

      if (result?.error) {
        console.error('Erro no login:', result.error)
        setError('Email ou senha incorretos. Verifique suas credenciais.')
        setLoading(false)
        return
      }

      // Se login bem-sucedido, redirecionar baseado no role
      if (result?.ok) {
        // Aguardar um pouco para a sessão ser criada e obter o role
        setTimeout(async () => {
          try {
            // Buscar dados da sessão para obter o role
            const sessionRes = await fetch('/api/auth/session')
            const sessionData = await sessionRes.json()
            const userRole = (sessionData?.user as any)?.role?.toLowerCase()

            // Verificar parâmetro 'next' ou redirecionar baseado no role
            const nextParam = searchParams.get('next')
            
            if (nextParam) {
              // Se há 'next', tentar usar, mas validar permissão
              window.location.href = nextParam
            } else {
              // Redirecionar baseado no role
              if (userRole === 'admin') {
                window.location.href = '/admin'
              } else {
                window.location.href = '/dashboard'
              }
            }
          } catch (error) {
            // Fallback para /dashboard
            window.location.href = '/dashboard'
          }
        }, 200)
        return
      }

      setError('Erro ao fazer login. Tente novamente.')
      setLoading(false)

    } catch (error: any) {
      console.error('Erro:', error)
      setError('Erro ao conectar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo acima do card */}
        <div className="mb-8 flex justify-center">
          <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-red-600/20">
            <Logo size="lg" />
            <p className="text-white text-center mt-4 text-sm font-semibold">Portal do Cliente</p>
          </div>
        </div>

        {/* Card de login */}
        <Card className="w-full border-red-600/30 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-4">
              <CardTitle className="text-2xl text-gray-900 font-bold">Bem-vindo de volta</CardTitle>
            <CardDescription className="text-gray-600">Entre com suas credenciais</CardDescription>
            {cadastroSucesso && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm text-center p-2 rounded mt-2">
                Cadastro realizado com sucesso! Faça login para continuar.
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900 focus:border-primary focus:ring-primary"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-medium">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white border-gray-300 text-gray-900 focus:border-primary focus:ring-primary"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm text-center p-3 rounded">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" 
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                <p>
                  Não tem uma conta?{' '}
                  <a href="/cadastro" className="text-primary hover:underline font-semibold">
                    Cadastre-se
                  </a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
