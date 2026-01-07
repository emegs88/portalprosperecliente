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
          {/* Main P body in red (#E30613) */}
          <path
            d="M 15 5
               L 15 95
               L 50 95
               Q 65 95 70 85
               Q 75 75 75 60
               Q 75 45 70 35
               Q 65 25 50 25
               L 45 25
               L 45 5
               Z"
            fill="#E30613"
          />
          
          {/* White swoosh - curva dinâmica cortando o P de baixo para cima */}
          <path
            d="M 12 75
               Q 12 70 18 65
               Q 25 60 32 55
               Q 40 50 48 45
               Q 56 40 62 35
               Q 68 30 72 25
               Q 76 20 78 15
               Q 80 10 80 8
               L 85 8
               Q 85 12 82 18
               Q 79 24 74 30
               Q 69 36 62 42
               Q 55 48 47 54
               Q 39 60 30 66
               Q 21 72 12 78
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
        <span className={`${currentSize.text} font-bold text-[#E30613] tracking-tight`}>
          PROSPERE
        </span>
      </div>
    </div>
  )
}
