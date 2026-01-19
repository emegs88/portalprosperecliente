'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ImportPreviewTable from '@/components/import/ImportPreviewTable'
import { Upload, FileText, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'

interface ImportBatch {
  id: string
  sourceType: string
  filename: string
  status: string
  createdAt: string
  parsedAt?: string
  quotasCount?: number
  totals?: {
    totalCotas: number
    totalVlBem: number
    totalVlParcela: number
  }
}

export function ImportacoesTab() {
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [importHistory, setImportHistory] = useState<ImportBatch[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [useOCR, setUseOCR] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError('')
    setSuccess('')
    setPreview(null)

    // Preview do arquivo selecionado
    setPreview({
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
    })
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Selecione um arquivo')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const isExcel = 
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')

      const formData = new FormData()
      formData.append('file', file)
      if (useOCR && !isExcel) {
        formData.append('useOCR', 'true')
      }

      // Sempre usar endpoint de OCR quando marcado, senão usar pdf normal
      const endpoint = isExcel ? '/api/import/excel' : useOCR ? '/api/import/pdf-ocr' : '/api/import/pdf'
      
      console.log('📤 Enviando para:', endpoint, { useOCR, isExcel })

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      // Verificar se a resposta é válida
      if (!response.ok) {
        let errorMessage = 'Erro ao importar arquivo'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (jsonError) {
          // Se não conseguiu parsear JSON, usar status text
          errorMessage = response.statusText || `Erro ${response.status}`
        }
        throw new Error(errorMessage)
      }

      // Tentar parsear JSON
      let data
      try {
        const text = await response.text()
        if (!text || text.trim().length === 0) {
          throw new Error('Resposta vazia do servidor')
        }
        data = JSON.parse(text)
      } catch (jsonError) {
        console.error('❌ Erro ao parsear JSON da resposta:', jsonError)
        throw new Error('Erro ao processar resposta do servidor. Tente novamente.')
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Resposta inválida do servidor')
      }

      setSuccess(`✅ ${data.quotasCount} cotas importadas com sucesso!`)
      setFile(null)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Recarregar histórico
      if (activeTab === 'history') {
        loadImportHistory()
      } else {
        setActiveTab('history')
        loadImportHistory()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar arquivo')
    } finally {
      setLoading(false)
    }
  }

  const loadImportHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/import/history')
      if (response.ok) {
        const data = await response.json()
        setImportHistory(data.batches || [])
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const getFileIcon = (sourceType: string) => {
    return sourceType === 'PDF' ? (
      <FileText className="w-5 h-5 text-red-500" />
    ) : (
      <FileSpreadsheet className="w-5 h-5 text-green-500" />
    )
  }

  const getStatusIcon = (status: string) => {
    return status === 'COMPLETED' ? (
      <CheckCircle2 className="w-5 h-5 text-green-500" />
    ) : (
      <AlertCircle className="w-5 h-5 text-yellow-500" />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Importações</h2>
        <p className="text-gray-400">
          Importe extratos em PDF ou planilhas Excel com suas cotas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v as 'upload' | 'history')
        if (v === 'history') {
          loadImportHistory()
        }
      }}>
        <TabsList className="bg-gray-800">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Importar Arquivo</CardTitle>
              <CardDescription className="text-gray-400">
                Selecione um arquivo PDF ou Excel para importar suas cotas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-block"
                >
                  <Button variant="outline" asChild>
                    <span>Selecionar Arquivo</span>
                  </Button>
                </label>
                {preview && (
                  <div className="mt-4 text-sm text-gray-300">
                    <p>
                      {preview.name} ({(preview.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-950/50 border border-red-500 rounded-lg p-4 flex items-center gap-2 text-red-300">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-950/50 border border-green-500 rounded-lg p-4 flex items-center gap-2 text-green-300">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{success}</span>
                </div>
              )}

              {/* Opção OCR para PDF */}
              {file && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && (
                <div className="flex items-center space-x-2 p-4 bg-gray-700/50 rounded-lg">
                  <Checkbox
                    id="useOCR"
                    checked={useOCR}
                    onCheckedChange={(checked) => setUseOCR(checked as boolean)}
                  />
                  <Label htmlFor="useOCR" className="text-gray-300 cursor-pointer text-sm">
                    Usar OCR para extrair texto do PDF (mais lento, mas mais preciso para PDFs escaneados)
                  </Label>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  'Importar Arquivo'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Importações</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : importHistory.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Nenhuma importação realizada ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {importHistory.map((batch) => (
                    <div
                      key={batch.id}
                      className="border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        {getFileIcon(batch.sourceType)}
                        <div>
                          <p className="text-white font-medium">{batch.filename}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(batch.createdAt).toLocaleString('pt-BR')}
                          </p>
                          {batch.totals && (
                            <p className="text-sm text-gray-400 mt-1">
                              {batch.totals.totalCotas} cotas •{' '}
                              {formatCurrency(batch.totals.totalVlBem)} total
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(batch.status)}
                        <span className="text-sm text-gray-400">{batch.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
