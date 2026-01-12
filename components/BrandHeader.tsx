'use client'

import { Logo } from './logo/Logo'

interface BrandHeaderProps {
  className?: string
}

export function BrandHeader({ className = '' }: BrandHeaderProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Logo - usando componente existente */}
      <Logo size="md" />
      
      {/* Nome da marca */}
      <div className="hidden sm:block">
        <h1 className="text-xl font-bold text-white">Consórcios Prospere</h1>
      </div>
    </div>
  )
}
