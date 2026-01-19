'use client'

import { AlertTriangle } from 'lucide-react'
import { loadConfig } from '@/lib/simulador/sorteio/config'
import { useEffect, useState } from 'react'

export function Disclaimer() {
  const [disclaimer, setDisclaimer] = useState<string>('')

  useEffect(() => {
    const config = loadConfig()
    setDisclaimer(config.disclaimer.text)
  }, [])

  if (!disclaimer) {
    return null
  }

  return (
    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm text-yellow-200 font-medium">
          {disclaimer}
        </p>
      </div>
    </div>
  )
}
