import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { width: 120, height: 40, text: 'text-sm' },
    md: { width: 180, height: 60, text: 'text-base' },
    lg: { width: 240, height: 80, text: 'text-xl' },
  }

  const currentSize = sizes[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/logo/logo-prospere.png"
        alt="Prospere Consórcios"
        width={currentSize.width}
        height={currentSize.height}
        className="object-contain"
        priority
      />
    </div>
  )
}
