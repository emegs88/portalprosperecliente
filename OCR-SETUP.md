# 🔍 OCR para Extração de PDF

## Status

OCR foi implementado como funcionalidade adicional. O sistema tenta primeiro extrair texto normalmente e, se não encontrar dados suficientes, usa OCR automaticamente.

## Dependências Instaladas

- `tesseract.js` - OCR em JavaScript
- `pdf2pic` - Conversão de PDF para imagem
- `canvas` - Renderização de imagens (Node.js)

## Como Funciona

1. **Primeira tentativa**: Extração de texto normal do PDF
2. **Se falhar**: OCR automático para extrair texto de PDFs escaneados

## Uso

O OCR é automático. Quando você faz upload de um PDF:
- Se o PDF tem texto selecionável → extração normal (rápido)
- Se o PDF é uma imagem escaneada → OCR (mais lento, mas funciona)

## Nota Importante

O OCR pode ser lento (30-60 segundos por página) dependendo do tamanho do PDF. O sistema mostra logs no console indicando quando está usando OCR.

## Melhorias Futuras

Para produção, considere:
- API externa de OCR (Google Cloud Vision, AWS Textract)
- Processamento assíncrono em background
- Cache de resultados
