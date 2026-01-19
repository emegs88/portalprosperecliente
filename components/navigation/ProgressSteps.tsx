'use client'

import { Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  label: string
  href?: string
}

interface ProgressStepsProps {
  steps: Step[]
  currentStep: string
  className?: string
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep
          const isCompleted = index < currentIndex
          const isUpcoming = index > currentIndex

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center flex-1",
                index < steps.length - 1 && "mr-2"
              )}
            >
              {/* Step */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted && "bg-green-500 border-green-500 text-white",
                    isActive && "bg-blue-500 border-blue-500 text-white ring-4 ring-blue-500/20",
                    isUpcoming && "bg-gray-700 border-gray-600 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-2 text-center font-medium",
                    isActive && "text-white",
                    isCompleted && "text-green-400",
                    isUpcoming && "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-1 flex-1 mx-2 transition-all",
                    isCompleted ? "bg-green-500" : "bg-gray-700"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
