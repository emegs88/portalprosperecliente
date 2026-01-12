'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/logo/Logo'
import { Upload, User, FileText, Mail } from 'lucide-react'

export default function UploadCadastroPage() {
  const router = useRouter()
  const [adminPassword, setAdminPassword] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [documento, setDocumento] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Senha simples para acesso de admin (em produção usar sistema de auth real)
  const ADMIN_PASSWORD = 'prospere2025'

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Senha de administrador incorreta')
    }
  }

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
      formData.append('adminPassword', ADMIN_PASSWORD) // Para autenticação no backend

      const res = await fetch('/api/admin/cadastrar-cliente-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao cadastrar cliente')
        setLoading(false)
        return
      }

      setSuccess(`✅ Cliente cadastrado com sucesso! ${data.quotasImportadas || 0} cotas importadas.`)
      
      // Limpar formulário
      setTimeout(() => {
        setName('')
        setEmail('')
        setPassword('')
        setDocumento('')
        setFile(null)
        setSuccess('')
      }, 5000)
      
      setLoading(false)
    } catch (error: any) {
      console.error('Erro:', error)
      setError('Erro ao conectar. Tente novamente.')
      setLoading(false)
    }
  }

  // Tela de autenticação
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-red-600/20">
              <Logo size="lg" />
              <p className="text-white text-center mt-4 text-sm font-semibold">Área de Upload</p>
            </div>
          </div>

          <Card className="w-full border-red-600/30 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-4">
              <CardTitle className="text-2xl text-gray-900 font-bold">Acesso Administrativo</CardTitle>
              <CardDescription className="text-gray-600">Digite a senha para continuar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminPassword" className="text-gray-900 font-medium">Senha de Administrador</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Digite a senha"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="bg-white border-gray-300 text-gray-900"
                    autoFocus
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
                >
                  Acessar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Tela principal de cadastro
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div className="bg-black/50 backdrop-blur-sm p-4 rounded-lg border border-red-600/20">
            <Logo size="md" />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsAuthenticated(false)}
            className="text-white border-red-600/50 hover:bg-red-600/20"
          >
            Sair
          </Button>
        </div>

        {/* Card de cadastro */}
        <Card className="w-full border-red-600/30 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-gray-900 font-bold flex items-center gap-2">
              <Upload className="h-6 w-6 text-primary" />
              Cadastrar Cliente com Extrato
            </CardTitle>
            <CardDescription className="text-gray-600">
              Faça upload do extrato e cadastre um novo cliente automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações do Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Cliente
                </h3>
                
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
                    <Label htmlFor="email" className="text-gray-900 font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email *
                    </Label>
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
                    <Label htmlFor="password" className="text-gray-900 font-medium">Senha do Cliente *</Label>
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
              </div>

              {/* Upload do Extrato */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Extrato do Consórcio
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="file" className="text-gray-900 font-medium">Arquivo (PDF ou Excel) *</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.xlsx,.xls"
                      onChange={handleFileChange}
                      required
                      className="bg-white border-gray-300 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    />
                  </div>
                  {file && (
                    <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded">
                      <p className="font-semibold">✓ Arquivo selecionado:</p>
                      <p>{file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm text-center p-4 rounded">
                  <p className="font-semibold">Erro:</p>
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm text-center p-4 rounded">
                  <p className="font-semibold text-lg">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-lg py-6"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Cadastrando e importando extrato...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Cadastrar Cliente e Importar Extrato
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
