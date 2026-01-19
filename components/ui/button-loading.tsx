'use client'

import { Button, ButtonProps } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonLoadingProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

export function ButtonLoading({
  loading = false,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: ButtonLoadingProps) {
  return (
    <Button
      className={cn(className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? loadingText || 'Carregando...' : children}
    </Button>
  )
}
