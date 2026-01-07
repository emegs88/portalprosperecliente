'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'

export default function AdminImportarPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const ext = selectedFile.name.split('.').pop()?.toLowerCase()
      
      if (!['pdf', 'xlsx', 'xls', 'csv'].includes(ext || '')) {
        setMessage('Formato de arquivo não suportado. Use PDF, XLSX, XLS ou CSV.')
        setStatus('error')
        return
      }

      setFile(selectedFile)
      setStatus('idle')
      setMessage('')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage('Por favor, selecione um arquivo.')
      setStatus('error')
      return
    }

    setUploading(true)
    setStatus('processing')
    setMessage('Enviando arquivo...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/importar-extrato', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao importar arquivo')
      }

      setJobId(data.jobId)
      setStatus('success')
      setMessage(`Arquivo enviado com sucesso! Job ID: ${data.jobId}`)
      
      // Limpar arquivo após sucesso
      setFile(null)
      
      // Limpar input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Erro ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <header className="border-b border-red-600/20 bg-black/50 backdrop-blur-sm mb-8">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin">
                  <Button variant="outline" className="text-white border-red-600/50 hover:bg-red-600/20">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
                <Logo size="md" />
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Importar Extrato</h1>
          <p className="text-gray-400 mt-2">Faça upload de extratos em PDF ou Excel para importar cotas</p>
        </div>

        {/* Card de Upload */}
        <Card className="bg-black/50 border-red-600/20">
          <CardHeader>
            <CardTitle className="text-white">Upload de Arquivo</CardTitle>
            <CardDescription className="text-gray-400">
              Formatos suportados: PDF, XLSX, XLS, CSV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Área de Upload */}
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-red-600/50 transition-colors">
              <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <input
                id="file-input"
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer inline-block"
              >
                <Button
                  variant="outline"
                  className="border-red-600/50 text-white hover:bg-red-600/20"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    <FileText className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </span>
                </Button>
              </label>
              {file && (
                <div className="mt-4">
                  <p className="text-white font-semibold">{file.name}</p>
                  <p className="text-gray-400 text-sm">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            {/* Status Message */}
            {status !== 'idle' && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                status === 'success' 
                  ? 'bg-green-900/30 border border-green-600/50' 
                  : status === 'error'
                  ? 'bg-red-900/30 border border-red-600/50'
                  : 'bg-blue-900/30 border border-blue-600/50'
              }`}>
                {status === 'processing' && <Loader2 className="h-5 w-5 animate-spin text-blue-400" />}
                {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                {status === 'error' && <XCircle className="h-5 w-5 text-red-400" />}
                <p className={`
                  ${status === 'success' ? 'text-green-300' : status === 'error' ? 'text-red-300' : 'text-blue-300'}
                `}>
                  {message}
                </p>
              </div>
            )}

            {/* Botão de Upload */}
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Extrato
                </>
              )}
            </Button>

            {/* Informações sobre OCR */}
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                <strong>💡 Nota:</strong> PDFs escaneados (sem texto selecionável) serão processados 
                automaticamente com OCR para extrair os dados das cotas.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Jobs Recentes */}
        {jobId && (
          <Card className="bg-black/50 border-red-600/20 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Status da Importação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                Job ID: <span className="text-white font-mono">{jobId}</span>
              </p>
              <p className="text-gray-400 mt-2 text-sm">
                A importação está sendo processada em background. Você pode verificar o status no dashboard.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
