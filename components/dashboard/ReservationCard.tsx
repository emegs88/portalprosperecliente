'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, QrCode, CheckCircle, XCircle, Loader } from 'lucide-react'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import { ReservationEmailButton } from './ReservationEmailButton'

interface ReservationCardProps {
  reservation: {
    id: string
    experience: {
      title: string
      imageUrl?: string
    }
    date: {
      date: string
      time?: string
    }
    status: string
    guestCount: number
    qrCode?: string
    qrCodeImage?: string
  }
}

const statusConfig = {
  pending: { label: 'Pendente', icon: Loader, color: 'text-yellow-400', bg: 'bg-yellow-400/20' },
  confirmed: { label: 'Confirmada', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/20' },
  cancelled: { label: 'Cancelada', icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/20' },
  completed: { label: 'Concluída', icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-400/20' },
  no_show: { label: 'Não compareceu', icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-400/20' },
}

export function ReservationCard({ reservation }: ReservationCardProps) {
  const status = statusConfig[reservation.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-blue-500/50 transition-all">
      {reservation.experience.imageUrl && (
        <div className="relative h-40 w-full">
          <Image
            src={reservation.experience.imageUrl}
            alt={reservation.experience.title}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 right-2">
            <Badge className={status.bg + ' ' + status.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-white text-lg">{reservation.experience.title}</CardTitle>
        <CardDescription className="text-gray-400">
          Reserva #{reservation.id.slice(0, 8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{new Date(reservation.date.date).toLocaleDateString('pt-BR')}</span>
        </div>
        {reservation.date.time && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{reservation.date.time}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users className="w-4 h-4" />
          <span>{reservation.guestCount} convidado{reservation.guestCount !== 1 ? 's' : ''}</span>
        </div>
        {(reservation.qrCodeImage || reservation.status === 'pending' || reservation.status === 'confirmed') && (
          <div className="pt-3 border-t border-gray-700 space-y-2">
            {reservation.qrCodeImage && reservation.status === 'confirmed' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Abrir modal com QR Code
                  window.open(reservation.qrCodeImage, '_blank')
                }}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Ver QR Code
              </Button>
            )}
            {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
              <ReservationEmailButton
                reservationId={reservation.id}
                variant="outline"
                size="sm"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
