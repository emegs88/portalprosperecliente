import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { width: 146, height: 100 },
    md: { width: 195, height: 134 },
    lg: { width: 292, height: 201 },
  }

  const currentSize = sizes[size]

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/logo/logo-prospere.png"
        alt="Consórcios Prospere"
        width={currentSize.width}
        height={currentSize.height}
        className="object-contain"
        priority
      />
    </div>
  )
}
