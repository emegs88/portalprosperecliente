'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'

export default function AdminCadastrarClientePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [documento, setDocumento] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name || !email || !password || !documento) {
      setError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    if (!file) {
      setError('Por favor, selecione um arquivo PDF ou Excel')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email.trim().toLowerCase())
      formData.append('password', password)
      formData.append('documento', documento)
      formData.append('file', file)

      const res = await fetch('/api/admin/cadastrar-cliente', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao cadastrar cliente')
        setLoading(false)
        return
      }

      setSuccess(`Cliente cadastrado com sucesso! ${data.quotasImportadas || 0} cotas importadas.`)
      
      // Limpar formulário
      setName('')
      setEmail('')
      setPassword('')
      setDocumento('')
      setFile(null)
      setLoading(false)

      setTimeout(() => {
        setSuccess('')
      }, 5000)
    } catch (error: any) {
      console.error('Erro:', error)
      setError('Erro ao conectar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex justify-center">
          <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-red-600/20">
            <Logo size="lg" />
            <p className="text-white text-center mt-4 text-sm font-semibold">Área Administrativa</p>
          </div>
        </div>

        {/* Card de cadastro */}
        <Card className="w-full border-red-600/30 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-2xl text-gray-900 font-bold">Cadastrar Cliente com Extrato</CardTitle>
            <CardDescription className="text-gray-600">
              Cadastre um novo cliente e importe o extrato automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-900 font-medium">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nome do cliente"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-900 font-medium">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@cliente.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documento" className="text-gray-900 font-medium">CPF/CNPJ *</Label>
                  <Input
                    id="documento"
                    type="text"
                    placeholder="000.000.000-00"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-900 font-medium">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900"
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file" className="text-gray-900 font-medium">Extrato (PDF ou Excel) *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.xlsx,.xls"
                  onChange={handleFileChange}
                  required
                  className="bg-white border-gray-300 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                />
                {file && (
                  <p className="text-sm text-gray-600 mt-1">
                    Arquivo selecionado: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm text-center p-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm text-center p-3 rounded">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                disabled={loading}
              >
                {loading ? 'Cadastrando e importando extrato...' : 'Cadastrar Cliente'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
