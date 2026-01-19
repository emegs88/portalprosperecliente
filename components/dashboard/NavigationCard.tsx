'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface NavigationCardProps {
  title: string
  description: string
  href: string
  icon?: React.ReactNode
  badge?: string
  external?: boolean
  className?: string
}

export function NavigationCard({
  title,
  description,
  href,
  icon,
  badge,
  external = false,
  className,
}: NavigationCardProps) {
  const content = (
    <Card className={cn(
      "bg-gray-800 border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer group",
      className
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="text-blue-500 group-hover:text-blue-400 transition-colors">
                {icon}
              </div>
            )}
            <div>
              <CardTitle className="text-white text-lg group-hover:text-blue-400 transition-colors">
                {title}
              </CardTitle>
              {badge && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded">
                  {badge}
                </span>
              )}
            </div>
          </div>
          {external ? (
            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
          ) : (
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-400">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  return (
    <Link href={href}>
      {content}
    </Link>
  )
}
