/**
 * StatCard - Componente Reutilizável para Cards KPI
 * Design System Premium: bordas visíveis, contraste AA, hover premium
 */

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  variant?: 'default' | 'positive' | 'negative' | 'neutral'
  className?: string
  iconClassName?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'default',
  className,
  iconClassName,
}: StatCardProps) {
  const variantStyles = {
    default: {
      bg: 'bg-[#0B1220]',
      border: 'border-[rgba(255,255,255,0.08)]',
      borderHover: 'hover:border-[rgba(59,130,246,0.35)]',
      titleColor: 'text-[#9CA3AF]',
      valueColor: 'text-[#FFFFFF]',
      descColor: 'text-[#9CA3AF]',
      iconColor: 'text-[#3B82F6]',
    },
    positive: {
      bg: 'bg-[#0B1220]',
      border: 'border-[rgba(16,185,129,0.2)]',
      borderHover: 'hover:border-[rgba(16,185,129,0.4)]',
      titleColor: 'text-[#9CA3AF]',
      valueColor: 'text-[#10B981]',
      descColor: 'text-[#9CA3AF]',
      iconColor: 'text-[#10B981]',
    },
    negative: {
      bg: 'bg-[#0B1220]',
      border: 'border-[rgba(239,68,68,0.2)]',
      borderHover: 'hover:border-[rgba(239,68,68,0.4)]',
      titleColor: 'text-[#9CA3AF]',
      valueColor: 'text-[#EF4444]',
      descColor: 'text-[#9CA3AF]',
      iconColor: 'text-[#EF4444]',
    },
    neutral: {
      bg: 'bg-[#0B1220]',
      border: 'border-[rgba(255,255,255,0.08)]',
      borderHover: 'hover:border-[rgba(255,255,255,0.15)]',
      titleColor: 'text-[#9CA3AF]',
      valueColor: 'text-[#FFFFFF]',
      descColor: 'text-[#9CA3AF]',
      iconColor: 'text-[#9CA3AF]',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        // Base
        'relative rounded-2xl p-6 transition-all duration-200',
        // Background
        styles.bg,
        // Border
        'border border-solid',
        styles.border,
        // Shadow Premium
        'shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.55)]',
        // Hover
        'hover:translate-y-[-2px] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_48px_rgba(0,0,0,0.65)]',
        styles.borderHover,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {Icon && (
          <Icon
            className={cn('w-5 h-5', styles.iconColor, iconClassName)}
            aria-hidden="true"
          />
        )}
        <h3
          className={cn(
            'text-xs font-medium tracking-wide uppercase',
            styles.titleColor
          )}
        >
          {title}
        </h3>
      </div>

      {/* Value */}
      <div className={cn('text-[32px] font-semibold mb-2 break-words', styles.valueColor)}>
        {value}
      </div>

      {/* Description */}
      {description && (
        <p className={cn('text-xs leading-relaxed', styles.descColor)}>
          {description}
        </p>
      )}
    </div>
  )
}
