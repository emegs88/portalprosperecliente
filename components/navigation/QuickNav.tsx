'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, ArrowRight, Settings, Grid3x3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickNavProps {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  backLabel?: string
  showHome?: boolean
  className?: string
}

export function QuickNav({ 
  onBack, 
  onNext, 
  nextLabel = 'Avançar', 
  backLabel = 'Voltar',
  showHome = false,
  className 
}: QuickNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      // Navegação automática baseada no pathname
      const parts = pathname.split('/').filter(Boolean)
      if (parts.length > 0) {
        parts.pop()
        router.push('/' + parts.join('/') || '/')
      } else {
        router.push('/')
      }
    }
  }

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-2">
        {showHome && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        )}
        {(onBack || pathname !== '/') && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Button>
        )}
      </div>

      {onNext && (
        <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700">
          {nextLabel}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  )
}
