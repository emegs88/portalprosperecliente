'use client'

import { usePathname } from 'next/navigation'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'
import { ProgressSteps } from '@/components/navigation/ProgressSteps'
import { Disclaimer } from '@/components/simulador/sorteio/Disclaimer'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'landing', label: 'Início', href: '/simulador/sorteio' },
  { id: 'configuracao', label: 'Configuração', href: '/simulador/sorteio/configuracao' },
  { id: 'selecao', label: 'Seleção', href: '/simulador/sorteio/selecao' },
  { id: 'trios', label: 'Trios', href: '/simulador/sorteio/trios' },
  { id: 'sorteio', label: 'Sorteio', href: '/simulador/sorteio/sorteio' },
  { id: 'resultado', label: 'Resultado', href: '/simulador/sorteio/resultado' },
]

function getCurrentStep(pathname: string): string {
  if (pathname.includes('/resultado')) return 'resultado'
  if (pathname.includes('/sorteio') && !pathname.includes('/resultado')) return 'sorteio'
  if (pathname.includes('/trios')) return 'trios'
  if (pathname.includes('/selecao')) return 'selecao'
  if (pathname.includes('/configuracao')) return 'configuracao'
  return 'landing'
}

export default function SimuladorSorteioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const currentStep = getCurrentStep(pathname)

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs />
        </div>
      </div>

      {/* Progress Steps */}
      {currentStep !== 'landing' && (
        <div className="border-b border-gray-800 bg-gray-800/50">
          <div className="container mx-auto px-4 py-6">
            <ProgressSteps
              steps={STEPS}
              currentStep={currentStep}
            />
          </div>
        </div>
      )}

      {/* Disclaimer Fixo */}
      <div className={cn(
        "bg-gray-900/95 backdrop-blur-sm border-b border-yellow-500/20",
        currentStep !== 'landing' ? "sticky top-[88px] z-40" : ""
      )}>
        <div className="container mx-auto px-4 py-3">
          <Disclaimer />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}
