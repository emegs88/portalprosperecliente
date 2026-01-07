'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { XCircle } from 'lucide-react'

export default function AdminCadastrarClientePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [documento, setDocumento] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [processingFile, setProcessingFile] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)
      const validFiles: File[] = []
      const invalidFiles: string[] = []

      selectedFiles.forEach(file => {
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (['pdf', 'xlsx', 'xls', 'csv'].includes(ext || '')) {
          validFiles.push(file)
        } else {
          invalidFiles.push(file.name)
        }
      })

      if (invalidFiles.length > 0) {
        setError(`Arquivos inválidos: ${invalidFiles.join(', ')}. Formatos suportados: PDF, XLSX, XLS, CSV.`)
      }

      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles])
        if (invalidFiles.length === 0) {
          setError('')
        }
      }
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
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

    if (files.length === 0) {
      setError('Por favor, selecione pelo menos um arquivo PDF ou Excel')
      return
    }

    setLoading(true)
    setProcessingFile(null)

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email.trim().toLowerCase())
      formData.append('password', password)
      formData.append('documento', documento)
      
      // Adicionar todos os arquivos
      files.forEach((file) => {
        formData.append(`files`, file)
      })

      // Simular progresso (a API processa em background)
      if (files.length > 1) {
        setProcessingFile(`Processando ${files.length} arquivos...`)
      } else {
        setProcessingFile(`Processando ${files[0]?.name}...`)
      }

      const res = await fetch('/api/admin/cadastrar-cliente', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao cadastrar cliente')
        setLoading(false)
        setProcessingFile(null)
        return
      }

      setSuccess(`Cliente cadastrado com sucesso! ${data.quotasImportadas || 0} cotas importadas de ${data.arquivosProcessados || files.length} arquivo(s).`)
      setProcessingFile(null)
      
      // Limpar formulário
      setName('')
      setEmail('')
      setPassword('')
      setDocumento('')
      setFiles([])
      
      // Limpar input
      const fileInput = document.getElementById('file') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      setLoading(false)

      setTimeout(() => {
        setSuccess('')
      }, 8000)
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
                <Label htmlFor="file" className="text-gray-900 font-medium">
                  Extrato (PDF ou Excel) * - Você pode selecionar múltiplos arquivos
                </Label>
                <p className="text-xs text-gray-500">
                  💡 Se o extrato estiver dividido em múltiplos PDFs (continuação), selecione todos para importação completa
                </p>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  required={files.length === 0}
                  multiple
                  className="bg-white border-gray-300 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                />
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-600 font-medium">
                      {files.length} arquivo(s) selecionado(s):
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            disabled={loading}
                            className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {processingFile && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm text-center p-3 rounded">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                    <span>{processingFile}</span>
                  </div>
                </div>
              )}

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
                {loading 
                  ? `Cadastrando e importando ${files.length} extrato(s)...` 
                  : 'Cadastrar Cliente'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
