import pdfParse from 'pdf-parse'

/**
 * Extrai texto de PDF - tenta extração normal primeiro
 * Se o texto extraído for muito pequeno, retorna o que conseguiu
 * (OCR completo seria melhor, mas requer bibliotecas mais pesadas)
 */
export async function extractTextWithOCR(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log('📄 Tentando extrair texto do PDF...')
    
    // Tentar extração normal com pdf-parse
    const pdfData = await pdfParse(pdfBuffer)
    const text = pdfData.text?.trim() || ''
    
    console.log(`📄 Texto extraído: ${text.length} caracteres`)
    
    if (text.length > 50) {
      console.log('✅ Texto extraído com sucesso do PDF')
      return text
    }
    
    // Se texto muito pequeno, pode ser PDF escaneado
    // Por enquanto, retornar o que conseguiu
    // Em produção, seria ideal usar:
    // - pdf2pic para converter PDF -> imagem
    // - Tesseract.js ou Google Cloud Vision para OCR
    // - ou uma API externa de OCR
    
    console.log('⚠️ PDF parece ser escaneado (pouco texto extraído)')
    console.log('💡 Texto extraído (primeiros 500 chars):', text.substring(0, 500))
    
    if (text.length === 0) {
      throw new Error('Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada e requer OCR avançado.')
    }
    
    return text
  } catch (error: any) {
    console.error('❌ Erro ao extrair texto do PDF:', error)
    
    // Se pdf-parse falhou, o PDF pode estar corrompido ou ser uma imagem
    if (error.message?.includes('Invalid') || error.message?.includes('corrupt')) {
      throw new Error('O PDF parece estar corrompido ou ser uma imagem escaneada. Requer OCR avançado.')
    }
    
    throw new Error(`Erro ao processar PDF: ${error.message}`)
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
