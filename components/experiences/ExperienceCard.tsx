'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Users, Award, Lock } from 'lucide-react'
import Image from 'next/image'

interface ExperienceCardProps {
  experience: {
    id: string
    slug: string
    title: string
    description?: string
    imageUrl?: string
    location?: string
    eligible: boolean
    availableSlots?: number | null
    clubLevel?: {
      name: string
      displayName: string
    }
  }
  onReserve?: () => void
}

export function ExperienceCard({ experience, onReserve }: ExperienceCardProps) {
  return (
    <Card
      className={`bg-gray-800 border-gray-700 hover:border-blue-500/50 transition-all overflow-hidden ${
        !experience.eligible ? 'opacity-60' : ''
      }`}
    >
      {experience.imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={experience.imageUrl}
            alt={experience.title}
            fill
            className="object-cover"
          />
          {!experience.eligible && experience.clubLevel && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-black/70 text-white">
                <Lock className="w-3 h-3 mr-1" />
                {experience.clubLevel.displayName}
              </Badge>
            </div>
          )}
          {experience.eligible && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-500/90 text-white">
                Disponível
              </Badge>
            </div>
          )}
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-white text-lg">{experience.title}</CardTitle>
        {experience.description && (
          <CardDescription className="text-gray-400 line-clamp-2">
            {experience.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {experience.location && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>{experience.location}</span>
          </div>
        )}
        {experience.availableSlots !== null && experience.availableSlots !== undefined && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>
              {experience.availableSlots > 0
                ? `${experience.availableSlots} vaga${experience.availableSlots !== 1 ? 's' : ''} disponível${experience.availableSlots !== 1 ? 'eis' : ''}`
                : 'Esgotado'}
            </span>
          </div>
        )}
        {experience.clubLevel && experience.eligible && (
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <Award className="w-4 h-4" />
            <span>Nível {experience.clubLevel.displayName}</span>
          </div>
        )}
        <Button
          onClick={onReserve}
          disabled={!experience.eligible || (experience.availableSlots !== null && experience.availableSlots <= 0)}
          className="w-full"
          variant={experience.eligible ? 'default' : 'outline'}
        >
          {experience.eligible
            ? experience.availableSlots !== null && experience.availableSlots <= 0
              ? 'Esgotado'
              : 'Ver Detalhes'
            : 'Ver Elegibilidade'}
        </Button>
      </CardContent>
    </Card>
  )
}
