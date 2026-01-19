'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Crown,
  FileText,
  Upload,
  TrendingUp,
  Heart,
  Target,
  Settings,
  LogOut,
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard?tab=dashboard', icon: LayoutDashboard },
  { id: 'prospere-club', label: 'Prospere Club', href: '/dashboard?tab=prospere-club', icon: Crown, badge: 'Novo' },
  { id: 'cotas', label: 'Cotas', href: '/dashboard?tab=cotas', icon: FileText },
  { id: 'importacoes', label: 'Importações', href: '/dashboard?tab=importacoes', icon: Upload },
  { id: 'patrimonio', label: 'Patrimônio', href: '/dashboard?tab=patrimonio', icon: TrendingUp },
  { id: 'prospere-vida', label: 'Prospere Vida', href: '/dashboard?tab=prospere-vida', icon: Heart },
  { id: 'simulacoes', label: 'Simulações', href: '/dashboard?tab=simulacoes', icon: Target },
  { id: 'plano-carreira', label: 'Plano de Carreira', href: '/dashboard?tab=plano-carreira', icon: Settings },
]

export function SideNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const searchParams = new URLSearchParams(pathname.includes('?') ? pathname.split('?')[1] : '')

  const activeTab = searchParams.get('tab') || 'dashboard'

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen fixed left-0 top-0 pt-20">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id || pathname.includes(item.href)

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              <Icon className={cn(
                "w-5 h-5",
                isActive ? "text-white" : "text-gray-400 group-hover:text-white"
              )} />
              <span className="flex-1 font-medium">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {/* Links Externos */}
        <div className="pt-4 mt-4 border-t border-gray-700 space-y-2">
          <Link
            href="/simulador/sorteio"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group",
              pathname.includes('/simulador/sorteio')
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            )}
          >
            <Dice6 className={cn(
              "w-5 h-5",
              pathname.includes('/simulador/sorteio') ? "text-white" : "text-gray-400 group-hover:text-white"
            )} />
            <span className="flex-1 font-medium">Simulador de Sorteio</span>
          </Link>
        </div>

        {/* Logout */}
        {session && (
          <div className="pt-4 mt-4 border-t border-gray-700">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-gray-300 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </div>
        )}
      </nav>
    </aside>
  )
}
