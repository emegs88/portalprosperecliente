'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/logo/Logo'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'

export default function AdminImportarPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [jobIds, setJobIds] = useState<string[]>([])
  const [processedFiles, setProcessedFiles] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)

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
        setMessage(`Arquivos inválidos: ${invalidFiles.join(', ')}. Formatos suportados: PDF, XLSX, XLS, CSV.`)
        setStatus('error')
      }

      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles])
        setStatus('idle')
        if (invalidFiles.length === 0) {
          setMessage('')
        }
      }
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (uploading) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles: File[] = []
    const invalidFiles: string[] = []

    droppedFiles.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (['pdf', 'xlsx', 'xls', 'csv'].includes(ext || '')) {
        validFiles.push(file)
      } else {
        invalidFiles.push(file.name)
      }
    })

    if (invalidFiles.length > 0) {
      setMessage(`Arquivos inválidos: ${invalidFiles.join(', ')}. Formatos suportados: PDF, XLSX, XLS, CSV.`)
      setStatus('error')
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
      setStatus('idle')
      if (invalidFiles.length === 0) {
        setMessage('')
      }
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage('Por favor, selecione pelo menos um arquivo.')
      setStatus('error')
      return
    }

    setUploading(true)
    setStatus('processing')
    setProcessedFiles(0)
    setJobIds([])
    setMessage(`Enviando ${files.length} arquivo(s)...`)

    const uploadedJobIds: string[] = []
    let successCount = 0
    let errorCount = 0

    try {
      // Processar cada arquivo sequencialmente
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setMessage(`Processando arquivo ${i + 1} de ${files.length}: ${file.name}...`)

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

          uploadedJobIds.push(data.jobId)
          successCount++
          setProcessedFiles(i + 1)

        } catch (error: any) {
          console.error(`Erro ao processar ${file.name}:`, error)
          errorCount++
          // Continuar processando os outros arquivos mesmo se um falhar
        }
      }

      setJobIds(uploadedJobIds)

      if (successCount > 0) {
        setStatus('success')
        if (errorCount > 0) {
          setMessage(`${successCount} arquivo(s) enviado(s) com sucesso. ${errorCount} arquivo(s) com erro.`)
        } else {
          setMessage(`${successCount} arquivo(s) enviado(s) com sucesso!`)
        }
      } else {
        setStatus('error')
        setMessage('Nenhum arquivo foi processado com sucesso.')
      }
      
      // Limpar arquivos após sucesso
      if (errorCount === 0) {
        setFiles([])
        // Limpar input
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      }

    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Erro ao enviar arquivos')
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
              Formatos suportados: PDF, XLSX, XLS, CSV. Você pode selecionar múltiplos arquivos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Área de Upload */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-red-600 bg-red-900/10'
                  : 'border-gray-700 hover:border-red-600/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <input
                id="file-input"
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
                multiple
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
                    Selecionar Arquivo(s)
                  </span>
                </Button>
              </label>
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-white font-semibold text-sm mb-2">
                    {files.length} arquivo(s) selecionado(s):
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-700/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{file.name}</p>
                          <p className="text-gray-400 text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 ml-2 flex-shrink-0"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
              disabled={files.length === 0 || uploading}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando {processedFiles}/{files.length} arquivo(s)...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {files.length > 0 ? `${files.length} ` : ''}Extrato(s)
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
        {jobIds.length > 0 && (
          <Card className="bg-black/50 border-red-600/20 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Status da Importação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-3">
                {jobIds.length} arquivo(s) enviado(s) para processamento:
              </p>
              <div className="space-y-2">
                {jobIds.map((jobId, index) => (
                  <div key={jobId} className="p-3 bg-black/30 rounded-lg border border-gray-700/50">
                    <p className="text-gray-400 text-sm">
                      Arquivo {index + 1} - Job ID: <span className="text-white font-mono">{jobId}</span>
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 mt-4 text-sm">
                As importações estão sendo processadas em background. Você pode verificar o status no dashboard.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
