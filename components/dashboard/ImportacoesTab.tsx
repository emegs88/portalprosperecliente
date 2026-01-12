'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, FileText, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ExcelMapping } from '@/lib/services/excelParser'
import ImportPreviewTable from '../import/ImportPreviewTable'

export default function ImportacoesTab() {
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'PDF' | 'XLSX'>('PDF')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [excelRows, setExcelRows] = useState<any[][]>([])
  const [mapping, setMapping] = useState<ExcelMapping>({})
  const [showMapping, setShowMapping] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      // Detectar tipo
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFileType('XLSX')
        previewExcel(selectedFile)
      } else {
        setFileType('PDF')
      }
    }
  }

  const previewExcel = async (file: File) => {
    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][]
      
      if (jsonData.length > 0) {
        setExcelHeaders(jsonData[0].map((h: any) => String(h || '').trim()))
        setExcelRows(jsonData.slice(1))
        setShowMapping(true)
      }
    } catch (error) {
      console.error('Erro ao preview Excel:', error)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    if (fileType === 'XLSX' && showMapping) {
      formData.append('mapping', JSON.stringify({
        headers: excelHeaders,
        rows: excelRows,
        mapping,
      }))
    }

    try {
      const endpoint = fileType === 'PDF' ? '/api/import/pdf' : '/api/import/excel'
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      setResult(data)
      
      if (data.success) {
        alert(data.message || `Importação concluída! ${data.quotasImportadas || 0} cotas importadas.`)
        window.location.reload()
      } else {
        const errorMsg = data.message || data.error || 'Erro ao importar arquivo'
        alert(`Erro: ${errorMsg}`)
        console.error('Erro na importação:', data)
      }
    } catch (error) {
      console.error('Erro ao importar:', error)
      alert('Erro ao importar arquivo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={fileType} onValueChange={(value) => setFileType(value as 'PDF' | 'XLSX')}>
        <TabsList className="bg-black/50 border border-red-600/20">
          <TabsTrigger value="PDF" className="data-[state=active]:bg-primary">
            <FileText className="h-4 w-4 mr-2" />
            Importar PDF
          </TabsTrigger>
          <TabsTrigger value="XLSX" className="data-[state=active]:bg-primary">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Importar Excel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="PDF">
          <Card className="bg-black/50 border-red-600/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importar PDF de Extrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pdf-file" className="text-white">
                  Selecione o arquivo PDF (formato Âncora)
                </Label>
                <Input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="bg-black border-red-600/20 text-white"
                />
              </div>

              {file && fileType === 'PDF' && (
                <div className="p-4 bg-black/30 rounded-lg">
                  <div className="flex items-center gap-2 text-white">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                    <span className="text-gray-400 text-sm">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!file || uploading || fileType !== 'PDF'}
                className="w-full"
              >
                {uploading ? 'Importando...' : 'Importar PDF'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="XLSX">
          <Card className="bg-black/50 border-red-600/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Importar Excel (.xlsx)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="excel-file" className="text-white">
                  Selecione o arquivo Excel
                </Label>
                <Input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="bg-black border-red-600/20 text-white"
                />
              </div>

              {file && fileType === 'XLSX' && (
                <>
                  <div className="p-4 bg-black/30 rounded-lg">
                    <div className="flex items-center gap-2 text-white">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>{file.name}</span>
                      <span className="text-gray-400 text-sm">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                  </div>

                  {showMapping && excelHeaders.length > 0 && (
                    <div className="space-y-4 p-4 bg-black/30 rounded-lg">
                      <h3 className="text-white font-semibold">Mapeamento de Colunas</h3>
                      <p className="text-sm text-gray-400">
                        Mapeie as colunas do Excel para os campos do sistema
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white text-sm">Grupo</Label>
                          <Select
                            value={mapping.grupo || ''}
                            onValueChange={(value) => setMapping({ ...mapping, grupo: value })}
                          >
                            <SelectTrigger className="bg-black border-red-600/20 text-white">
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              {excelHeaders.map((h, idx) => (
                                <SelectItem key={idx} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white text-sm">Cota</Label>
                          <Select
                            value={mapping.cota || ''}
                            onValueChange={(value) => setMapping({ ...mapping, cota: value })}
                          >
                            <SelectTrigger className="bg-black border-red-600/20 text-white">
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              {excelHeaders.map((h, idx) => (
                                <SelectItem key={idx} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white text-sm">Valor do Bem</Label>
                          <Select
                            value={mapping.vlBem || ''}
                            onValueChange={(value) => setMapping({ ...mapping, vlBem: value })}
                          >
                            <SelectTrigger className="bg-black border-red-600/20 text-white">
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              {excelHeaders.map((h, idx) => (
                                <SelectItem key={idx} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white text-sm">Parcela</Label>
                          <Select
                            value={mapping.vlParcela || ''}
                            onValueChange={(value) => setMapping({ ...mapping, vlParcela: value })}
                          >
                            <SelectTrigger className="bg-black border-red-600/20 text-white">
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              {excelHeaders.map((h, idx) => (
                                <SelectItem key={idx} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <Button
                onClick={handleUpload}
                disabled={!file || uploading || !mapping.grupo || !mapping.cota}
                className="w-full"
              >
                {uploading ? 'Importando...' : 'Importar Excel'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {result && result.quotas && (
        <ImportPreviewTable
          quotas={result.quotas}
          onConfirm={() => window.location.reload()}
          loading={uploading}
        />
      )}
    </div>
  )
}
