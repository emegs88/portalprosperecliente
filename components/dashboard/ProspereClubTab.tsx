'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Crown, Award, TrendingUp, Target, Gift, Calendar, CheckCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExperienceCard } from '@/components/experiences/ExperienceCard'
import { ReservationCard } from '@/components/dashboard/ReservationCard'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ClubStatus {
  currentLevel: {
    id: string
    name: string
    displayName: string
    color: string
    description?: string
    benefits: string[]
  }
  nextLevel: {
    id: string
    name: string
    displayName: string
    minCreditBRL: number
    color: string
    description?: string
    benefits: string[]
  } | null
  currentCredit: number
  progressToNext: number
  creditToNext: number
  benefits: string[]
}

interface Experience {
  id: string
  slug: string
  title: string
  description?: string
  imageUrl?: string
  location?: string
  eligible: boolean
  availableSlots?: number
  clubLevel?: {
    name: string
    displayName: string
  }
}

interface Reservation {
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
  qrCode?: string
  qrCodeImage?: string
}

export function ProspereClubTab() {
  const [clubStatus, setClubStatus] = useState<ClubStatus | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClubData()
  }, [])

  const fetchClubData = async () => {
    try {
      const [statusRes, experiencesRes, reservationsRes] = await Promise.all([
        fetch('/api/club/status'),
        fetch('/api/experiences'),
        fetch('/api/reservations'),
      ])

      if (statusRes.ok) {
        const status = await statusRes.json()
        setClubStatus(status)
      }

      if (experiencesRes.ok) {
        const data = await experiencesRes.json()
        setExperiences(data.experiences || [])
      }

      if (reservationsRes.ok) {
        const data = await reservationsRes.json()
        setReservations(data.reservations || [])
      }
    } catch (error) {
      console.error('Error fetching club data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Carregando...</div>
      </div>
    )
  }

  if (!clubStatus) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Erro ao carregar dados do clube</div>
      </div>
    )
  }

  const currentLevel = clubStatus.currentLevel
  const nextLevel = clubStatus.nextLevel

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Crown className="w-8 h-8 text-yellow-500" />
          Prospere Club
        </h2>
        <p className="text-gray-400 text-lg">
          Você evolui por performance e consistência. Cada nível aumenta: comissão, bônus, acesso a leads e participação em projetos.
        </p>
      </div>

      {/* Status do Clube */}
      <Card className="bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-indigo-600/20 border-purple-500/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl">
                Nível Atual: {currentLevel.displayName}
              </CardTitle>
              <CardDescription className="text-gray-300 mt-2">
                {currentLevel.description || 'Seu nível atual no clube'}
              </CardDescription>
            </div>
            <Badge
              className="text-lg px-4 py-2"
              style={{ backgroundColor: currentLevel.color, color: '#fff' }}
            >
              {currentLevel.displayName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Crédito Atual */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Crédito Total</span>
              <span className="text-2xl font-bold text-white">
                {formatCurrency(clubStatus.currentCredit)}
              </span>
            </div>
          </div>

          {/* Progresso para Próximo Nível */}
          {nextLevel && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">
                  Progresso para {nextLevel.displayName}
                </span>
                <span className="text-white font-bold">
                  {formatPercent(clubStatus.progressToNext)}
                </span>
              </div>
              <Progress value={clubStatus.progressToNext} className="h-3" />
              <p className="text-sm text-gray-400">
                Faltam {formatCurrency(clubStatus.creditToNext)} para alcançar o próximo nível
              </p>
            </div>
          )}

          {/* Benefícios */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-400" />
              Seus Benefícios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clubStatus.benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="experiencias" className="w-full">
        <TabsList className="bg-gray-800 grid grid-cols-3">
          <TabsTrigger value="experiencias">Experiências</TabsTrigger>
          <TabsTrigger value="reservas">Minhas Reservas</TabsTrigger>
          <TabsTrigger value="progresso">Meu Progresso</TabsTrigger>
        </TabsList>

        <TabsContent value="experiencias" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Experiências Disponíveis
              </h3>
              <Badge variant="outline" className="text-white">
                {experiences.length} experiência{experiences.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {experiences.map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  onReserve={() => window.location.href = `/experiencias/${experience.slug}`}
                />
              ))}
            </div>
            {experiences.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                Nenhuma experiência disponível no momento
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reservas" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Minhas Reservas
              </h3>
              <Badge variant="outline" className="text-white">
                {reservations.length} reserva{reservations.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                />
              ))}
            </div>
            {reservations.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                Você ainda não fez nenhuma reserva
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progresso" className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Evolução do Patrimônio</CardTitle>
              <CardDescription className="text-gray-400">
                Acompanhe seu progresso no clube
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Gráfico de evolução */}
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { mes: 'Jan', patrimonio: 0 },
                    { mes: 'Fev', patrimonio: clubStatus.currentCredit * 0.3 },
                    { mes: 'Mar', patrimonio: clubStatus.currentCredit * 0.5 },
                    { mes: 'Abr', patrimonio: clubStatus.currentCredit * 0.7 },
                    { mes: 'Mai', patrimonio: clubStatus.currentCredit },
                  ]}>
                    <defs>
                      <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="mes" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="patrimonio"
                      stroke="#8B5CF6"
                      fill="url(#colorPatrimonio)"
                      name="Patrimônio"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
