'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Se não fornecido, gerar automaticamente a partir do pathname
  const breadcrumbs = items || generateBreadcrumbs(pathname)

  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-2 text-sm", className)}>
      <ol className="flex items-center gap-2 flex-wrap">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <li key={item.href} className="flex items-center gap-2">
              {index === 0 && (
                <Home className="w-4 h-4 text-gray-400" />
              )}
              {isLast ? (
                <span className="text-gray-300 font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const parts = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' }
  ]

  let currentPath = ''
  
  parts.forEach((part, index) => {
    currentPath += `/${part}`
    
    // Mapear partes para labels amigáveis
    const labels: Record<string, string> = {
      'dashboard': 'Dashboard',
      'simulador': 'Simulador',
      'sorteio': 'Sorteio',
      'configuracao': 'Configuração',
      'selecao': 'Seleção',
      'trios': 'Trios',
      'sorteio': 'Sorteio',
      'resultado': 'Resultado',
      'admin': 'Admin',
      'simulador-config': 'Config do Simulador',
      'prospere-club': 'Prospere Club',
      'cotas': 'Cotas',
      'importacoes': 'Importações',
      'patrimonio': 'Patrimônio',
      'simulacoes': 'Simulações',
      'plano-carreira': 'Plano de Carreira',
    }

    breadcrumbs.push({
      label: labels[part] || part.charAt(0).toUpperCase() + part.slice(1),
      href: currentPath,
    })
  })

  return breadcrumbs
}
