'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error caught by Next.js error boundary:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-4">
      <Card className="bg-[#0B1220] border border-[rgba(239,68,68,0.3)] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.55)] max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#EF4444]" />
            <CardTitle className="text-[#FFFFFF]">Algo deu errado</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[#9CA3AF] text-sm">
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </p>
          {error.digest && (
            <details className="bg-[#0E1625] rounded p-3 text-xs text-[#9CA3AF] font-mono border border-[rgba(255,255,255,0.05)]">
              <summary className="cursor-pointer mb-2 text-[#FFFFFF]">Detalhes do erro</summary>
              <pre className="whitespace-pre-wrap overflow-auto mt-2">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <Button 
              onClick={reset} 
              variant="outline" 
              className="flex-1 border-[rgba(59,130,246,0.35)] text-[#3B82F6] hover:bg-[#3B82F6]/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="flex-1 border-[rgba(255,255,255,0.08)] text-[#9CA3AF] hover:bg-[rgba(255,255,255,0.05)]"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
