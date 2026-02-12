'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  ShoppingCart,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  Award,
  BarChart3,
  Loader2,
  Shield,
  RefreshCw,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BrandHeader } from '@/components/BrandHeader'
import { LogoutButton } from '@/components/LogoutButton'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface AdminStats {
  overview: {
    totalUsers: number
    totalClients: number
    totalQuotas: number
    totalSales: number
    totalSimulations: number
    totalReservations: number
  }
  quotas: {
    total: number
    contempladas: number
    naoContempladas: number
    totalCredit: number
    totalInstallment: number
    totalToReceive: number
  }
  sales: {
    total: number
    totalCredit: number
    totalInstallment: number
    avgCredit: number
    avgInstallment: number
    byStatus: Array<{ status: string; count: number }>
  }
  simulations: {
    total: number
    totalRuns: number
    totalPatrimonio: number
    totalPago: number
  }
  users: {
    byRole: Array<{ role: string; count: number }>
  }
  last30Days: {
    newUsers: number
    newSales: number
    newQuotas: number
    newSimulations: number
  }
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard')
      } else {
        loadStats()
      }
    }
  }, [status, session, router])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/stats')
      
      if (response.status === 403) {
        setError('Acesso negado. Apenas administradores podem acessar esta página.')
        return
      }

      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas')
      }

      const data = await response.json()
      setStats(data)
    } catch (error: any) {
      console.error('Erro ao carregar stats:', error)
      setError(error.message || 'Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-[#070B14]">
        <BrandHeader />
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-[#0B1220] border-red-500/50">
            <CardContent className="py-12 text-center">
              <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const pieDataUsers = stats?.users.byRole.map(u => ({
    name: u.role,
    value: u.count,
  })) || []

  const barDataSales = stats?.sales.byStatus.map(s => ({
    status: s.status,
    count: s.count,
  })) || []

  return (
    <div className="min-h-screen bg-[#070B14]">
      <BrandHeader />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
              <Badge className="bg-blue-600 text-white">ADMIN</Badge>
            </div>
            <p className="text-gray-400">Visão geral da plataforma Prospere</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadStats}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <LogoutButton />
          </div>
        </div>

        {/* Cards de KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#0B1220] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">
                {stats?.overview.totalUsers || 0}
              </div>
              <div className="text-xs text-gray-500">
                {stats?.overview.totalClients || 0} clientes
              </div>
              <div className="text-xs text-green-400 mt-1">
                +{stats?.last30Days.newUsers || 0} nos últimos 30 dias
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0B1220] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Total de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">
                {stats?.overview.totalSales || 0}
              </div>
              <div className="text-xs text-gray-500">
                Crédito total: {formatCurrency(stats?.sales.totalCredit || 0)}
              </div>
              <div className="text-xs text-green-400 mt-1">
                +{stats?.last30Days.newSales || 0} nos últimos 30 dias
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0B1220] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Total de Cotas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">
                {stats?.overview.totalQuotas || 0}
              </div>
              <div className="text-xs text-gray-500">
                {stats?.quotas.contempladas || 0} contempladas • {stats?.quotas.naoContempladas || 0} não contempladas
              </div>
              <div className="text-xs text-green-400 mt-1">
                +{stats?.last30Days.newQuotas || 0} nos últimos 30 dias
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0B1220] border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Simulações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">
                {stats?.overview.totalSimulations || 0}
              </div>
              <div className="text-xs text-gray-500">
                {stats?.simulations.totalRuns || 0} execuções realizadas
              </div>
              <div className="text-xs text-green-400 mt-1">
                +{stats?.last30Days.newSimulations || 0} nos últimos 30 dias
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com Detalhes */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[#0B1220] border border-gray-700">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="quotas">Cotas</TabsTrigger>
            <TabsTrigger value="simulations">Simulações</TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico: Usuários por Role */}
              <Card className="bg-[#0B1220] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Usuários por Perfil</CardTitle>
                  <CardDescription className="text-gray-400">
                    Distribuição de usuários por role
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieDataUsers}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieDataUsers.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cards de Valores Totais */}
              <div className="space-y-4">
                <Card className="bg-[#0B1220] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Valores Totais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Crédito Total (Cotas)</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(stats?.quotas.totalCredit || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Parcela Total (Cotas)</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(stats?.quotas.totalInstallment || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Crédito Total (Vendas)</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {formatCurrency(stats?.sales.totalCredit || 0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Vendas */}
          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0B1220] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Vendas por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barDataSales}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="status" stroke="#999" tick={{ fill: '#999', fontSize: 12 }} />
                        <YAxis stroke="#999" tick={{ fill: '#999', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                        />
                        <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0B1220] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Estatísticas de Vendas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total de Vendas</p>
                    <p className="text-2xl font-bold text-white">
                      {stats?.sales.total || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Crédito Total</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {formatCurrency(stats?.sales.totalCredit || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Parcela Total</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(stats?.sales.totalInstallment || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Crédito Médio</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(stats?.sales.avgCredit || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Cotas */}
          <TabsContent value="quotas" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#0B1220] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-base">Total de Cotas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {stats?.quotas.total || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-600/20 border-green-500/50">
                <CardHeader>
                  <CardTitle className="text-green-400 text-base">Contempladas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {stats?.quotas.contempladas || 0}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {stats?.quotas.total ? ((stats.quotas.contempladas / stats.quotas.total) * 100).toFixed(1) : 0}%
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-yellow-600/20 border-yellow-500/50">
                <CardHeader>
                  <CardTitle className="text-yellow-400 text-base">Não Contempladas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {stats?.quotas.naoContempladas || 0}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {stats?.quotas.total ? ((stats.quotas.naoContempladas / stats.quotas.total) * 100).toFixed(1) : 0}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#0B1220] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Valores Totais de Cotas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Crédito Total</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(stats?.quotas.totalCredit || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Parcela Total</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(stats?.quotas.totalInstallment || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total a Receber</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(stats?.quotas.totalToReceive || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Simulações */}
          <TabsContent value="simulations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#0B1220] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-base">Projetos de Simulação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {stats?.simulations.total || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-600/20 border-blue-500/50">
                <CardHeader>
                  <CardTitle className="text-blue-400 text-base">Execuções Realizadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {stats?.simulations.totalRuns || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-600/20 border-green-500/50">
                <CardHeader>
                  <CardTitle className="text-green-400 text-base">Patrimônio Simulado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(stats?.simulations.totalPatrimonio || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
