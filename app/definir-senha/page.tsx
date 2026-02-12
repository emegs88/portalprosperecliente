'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

export default function DefinirSenhaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token || !email) {
      setError('Link inválido. Verifique o link recebido por email.')
    }
  }, [token, email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao definir senha')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Erro ao definir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.3),transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-700/50">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                {success ? (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                ) : (
                  <Lock className="w-8 h-8 text-blue-200" />
                )}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {success ? 'Senha Definida!' : 'Defina sua Senha'}
            </h1>
            <p className="text-blue-100 text-sm">
              {success
                ? 'Agora você pode acessar o portal'
                : 'Crie uma senha para acessar o Portal Prospere'}
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {success ? (
              <div className="text-center space-y-6">
                <div className="bg-green-900/30 border border-green-500/50 text-green-300 p-4 rounded-lg">
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  Sua senha foi criada com sucesso!
                </div>
                <Button
                  onClick={() => router.push('/acessos')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 text-base"
                >
                  Fazer Login
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {email && (
                  <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400">Criando senha para</p>
                    <p className="text-sm text-white font-medium">{decodeURIComponent(email)}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300 font-semibold text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Nova Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={!token || !email}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-gray-300 font-semibold text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={!token || !email}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !token || !email}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 text-base"
                >
                  {loading ? 'Salvando...' : 'Definir Senha'}
                </Button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-6">
            <div className="border-t border-gray-700/50 pt-4">
              <p className="text-center text-xs text-gray-400">
                Prospere Consórcios - Portal do Cliente
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/acessos" className="text-blue-300 hover:text-blue-200 text-sm">
            Já tem senha? Faça login
          </Link>
        </div>
      </div>
    </div>
  )
}
