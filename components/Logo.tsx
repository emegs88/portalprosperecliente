import React from 'react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { p: 'w-12 h-12', text: 'text-sm', gap: 'gap-2' },
    md: { p: 'w-16 h-16', text: 'text-base', gap: 'gap-3' },
    lg: { p: 'w-24 h-24', text: 'text-2xl', gap: 'gap-4' },
  }

  const currentSize = sizes[size]

  return (
    <div className={`flex items-center ${currentSize.gap} ${className}`}>
      {/* Stylized P - Modelo Prospere com curva branca dinâmica */}
      <div className={`${currentSize.p} relative flex-shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main P body in red */}
          <path
            d="M10 10 L10 90 L55 90 L55 55 L60 55 L60 10 Z"
            fill="#DC2626"
          />
          
          {/* White swoosh - curva suave do canto superior direito para inferior esquerdo */}
          <path
            d="M15 15
               L 55 15
               C 57 18, 58 22, 57 26
               C 56 30, 54 34, 51 38
               C 48 42, 44 46, 39 50
               C 34 54, 28 58, 22 62
               L 15 62
               L 15 85
               L 50 85
               L 50 50
               C 48 46, 45 42, 41 38
               C 37 34, 32 30, 26 26
               C 20 22, 15 18, 15 15
               Z"
            fill="white"
          />
        </svg>
      </div>
      
      {/* Text - exatamente como no modelo original */}
      <div className="flex flex-col leading-tight">
        <span className={`${currentSize.text} font-bold text-white tracking-tight`}>
          CONSÓRCIOS
        </span>
        <span className={`${currentSize.text} font-bold text-primary tracking-tight`}>
          PROSPERE
        </span>
      </div>
    </div>
  )
}
