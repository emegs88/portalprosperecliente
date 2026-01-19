'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface ReservationEmailButtonProps {
  reservationId: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
}

export function ReservationEmailButton({ 
  reservationId, 
  variant = 'outline',
  size = 'sm'
}: ReservationEmailButtonProps) {
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const handleResendEmail = async () => {
    setSending(true)
    try {
      const res = await fetch(`/api/reservations/${reservationId}/confirm`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Erro ao reenviar email')
      }

      toast({
        variant: 'success',
        title: 'Email reenviado!',
        description: 'Email de confirmação enviado com sucesso.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao reenviar email',
        description: error.message || 'Não foi possível reenviar o email.',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleResendEmail}
      disabled={sending}
    >
      {sending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          <Mail className="w-4 h-4 mr-2" />
          Reenviar Email
        </>
      )}
    </Button>
  )
}
