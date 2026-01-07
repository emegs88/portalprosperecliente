'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { BrandHeader } from '@/components/BrandHeader'
import { UserPlus } from 'lucide-react'
import { setAuthCookie, type Role } from '@/lib/auth-mock'

export default function CadastroPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [tipoConta, setTipoConta] = useState<Role>('CLIENTE')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validações
    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      // Tentar cadastro via API (NextAuth/Prisma)
      const res = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          password,
          role: tipoConta.toLowerCase(), // 'cliente' ou 'admin'
        }),
      })

      const data = await res.json()

      if (!res.ok && !data.success) {
        // Se API falhar, usar auth mock apenas para testes
        console.warn('API falhou, usando auth mock para teste')
        setAuthCookie({
          name,
          email: email.trim().toLowerCase(),
          role: tipoConta,
        })
        
        setSuccess('Cadastro realizado com sucesso! (modo teste)')
        
        // Redirecionar baseado no tipo de conta
        setTimeout(() => {
          if (tipoConta === 'CLIENTE') {
            router.push('/dashboard')
          } else {
            router.push('/admin')
          }
        }, 1500)
        return
      }

      // Se API funcionou, também setar cookie mock para compatibilidade
      setAuthCookie({
        name,
        email: email.trim().toLowerCase(),
        role: tipoConta,
      })

      setSuccess('Cadastro realizado com sucesso!')
      
      // Redirecionar baseado no tipo de conta
      setTimeout(() => {
        if (tipoConta === 'CLIENTE') {
          router.push('/dashboard')
        } else {
          router.push('/admin')
        }
      }, 1500)

    } catch (error: any) {
      console.error('Erro:', error)
      // Em caso de erro, usar auth mock para continuar
      setAuthCookie({
        name,
        email: email.trim().toLowerCase(),
        role: tipoConta,
      })
      
      setSuccess('Cadastro realizado (modo offline)!')
      
      setTimeout(() => {
        if (tipoConta === 'CLIENTE') {
          router.push('/dashboard')
        } else {
          router.push('/admin')
        }
      }, 1500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0B0B] via-gray-900 to-[#0B0B0B] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex justify-center">
          <BrandHeader />
        </div>

        {/* Card de cadastro */}
        <Card className="w-full border-red-600/30 bg-black/40 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-2xl text-white font-bold flex items-center justify-center gap-2">
              <UserPlus className="h-6 w-6 text-[#E30613]" />
              Criar Conta
            </CardTitle>
            <CardDescription className="text-gray-400">
              Preencha os dados para se cadastrar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white font-medium">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#E30613]"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#E30613]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#E30613]"
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-medium">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-black/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#E30613]"
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium">Tipo de Conta</Label>
                <RadioGroup 
                  value={tipoConta} 
                  onValueChange={(value: Role) => setTipoConta(value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CLIENTE" id="cliente" className="border-gray-600" />
                    <Label htmlFor="cliente" className="text-gray-300 cursor-pointer">Cliente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ADMIN" id="admin" className="border-gray-600" />
                    <Label htmlFor="admin" className="text-gray-300 cursor-pointer">Administrador (testes)</Label>
                  </div>
                </RadioGroup>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-600/50 text-red-300 text-sm text-center p-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-900/30 border border-green-600/50 text-green-300 text-sm text-center p-3 rounded">
                  {success}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-[#E30613] hover:bg-[#E30613]/90 text-white font-semibold" 
                disabled={loading}
              >
                {loading ? 'Cadastrando...' : 'Criar Conta'}
              </Button>

              <div className="text-center text-sm text-gray-400">
                <p>
                  Já tem uma conta?{' '}
                  <Link href="/login" className="text-[#E30613] hover:underline font-semibold">
                    Faça login
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
