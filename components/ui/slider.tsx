'use client'

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center group cursor-pointer py-1",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-white/[0.08]">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.35)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full bg-white shadow-[0_0_0_3px_rgba(59,130,246,0.3),0_0_16px_rgba(59,130,246,0.4)] ring-0 outline-none transition-all duration-200 hover:scale-[1.15] hover:shadow-[0_0_0_4px_rgba(59,130,246,0.4),0_0_24px_rgba(59,130,246,0.5)] active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1628] disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
