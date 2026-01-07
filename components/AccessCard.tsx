'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon, ArrowRight } from 'lucide-react'

interface AccessCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  onClick?: () => void
  className?: string
}

export function AccessCard({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  onClick,
  className = '' 
}: AccessCardProps) {
  return (
    <Card 
      className={`
        bg-black/40 border-red-600/30 hover:border-red-600/50 
        transition-all cursor-pointer 
        hover:shadow-lg hover:shadow-red-600/20
        ${className}
      `}
      onClick={onClick}
    >
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
          <Icon className="h-8 w-8 text-[#E30613]" />
        </div>
        <CardTitle className="text-2xl text-white mb-2">{title}</CardTitle>
        <CardDescription className="text-gray-400">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          className="w-full bg-[#E30613] hover:bg-[#E30613]/90 text-white"
          onClick={(e) => {
            e.stopPropagation()
            if (onClick) onClick()
            else window.location.href = href
          }}
        >
          Acessar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
