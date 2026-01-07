import { createWorker } from 'tesseract.js'
import pdfParse from 'pdf-parse'

/**
 * Extrai texto de PDF usando OCR quando necessário
 */
export async function extractTextWithOCR(pdfBuffer: Buffer): Promise<string> {
  try {
    // Primeiro, tentar extração normal
    try {
      const pdfData = await pdfParse(pdfBuffer)
      const text = pdfData.text?.trim() || ''
      
      // Se conseguiu extrair texto suficiente (>100 caracteres), usar
      if (text.length > 100) {
        console.log('✅ Texto extraído normalmente do PDF')
        return text
      }
    } catch (error) {
      console.log('⚠️ Falha na extração normal, tentando OCR...')
    }

    // Se não conseguiu texto suficiente, usar OCR
    console.log('🔍 Iniciando OCR com Tesseract.js...')
    
    // NOTA: Tesseract.js funciona melhor no browser
    // Para servidor Node.js, pode ser necessário usar pdf-to-img primeiro
    // Por enquanto, vamos usar uma abordagem simplificada
    
    const worker = await createWorker('por') // Português
    
    try {
      // Converter primeira página do PDF para imagem (simulação)
      // Em produção, use pdf2pic ou similar para converter PDF -> imagem
      
      // Por enquanto, tentar OCR diretamente no buffer
      // Isso pode não funcionar perfeitamente, mas é um começo
      
      const { data: { text } } = await worker.recognize(pdfBuffer as any)
      
      await worker.terminate()
      
      if (text && text.trim().length > 100) {
        console.log('✅ Texto extraído com OCR')
        return text
      }
      
      throw new Error('OCR não conseguiu extrair texto suficiente')
    } catch (ocrError) {
      await worker.terminate()
      throw new Error(`Erro no OCR: ${ocrError}. Considere usar uma API externa como Google Cloud Vision.`)
    }
  } catch (error: any) {
    console.error('❌ Erro ao extrair texto com OCR:', error)
    throw new Error(`Não foi possível extrair texto do PDF: ${error.message}`)
  }
}

/**
 * Verifica se um PDF precisa de OCR (baseado no tamanho do texto extraído)
 */
export async function needsOCR(pdfBuffer: Buffer): Promise<boolean> {
  try {
    const pdfData = await pdfParse(pdfBuffer)
    const text = pdfData.text?.trim() || ''
    
    // Se texto muito pequeno, provavelmente precisa OCR
    return text.length < 100
  } catch {
    // Se erro ao fazer parse, provavelmente precisa OCR
    return true
  }
}
