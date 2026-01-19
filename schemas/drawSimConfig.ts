import { z } from 'zod'

export const DrawSimConfigSchema = z.object({
  version: z.string(),
  range: z.object({
    min: z.number().int().min(0).max(999),
    max: z.number().int().min(0).max(999),
  }).refine((data) => data.max > data.min, {
    message: "max deve ser maior que min"
  }),
  draw: z.object({
    count: z.number().int().min(1).max(10),
    seed: z.number().nullable().optional(),
  }),
  trio: z.object({
    size: z.number().int().min(2).max(5),
    minTrios: z.number().int().min(1),
    maxTrios: z.number().int().min(1).max(20),
  }),
  selection: z.object({
    maxSelected: z.number().int().min(1).max(100),
    enableSearch: z.boolean(),
    enableQuickSelect: z.boolean(),
  }),
  animation: z.object({
    speed: z.enum(["slow", "medium", "fast"]),
    enableSounds: z.boolean(),
    soundVolume: z.number().min(0).max(1),
    enableConfetti: z.boolean(),
    revealDelay: z.number().int().min(100).max(5000),
  }),
  features: z.object({
    enableHistory: z.boolean(),
    enableStats: z.boolean(),
    enableEducativeText: z.boolean(),
  }),
  modes: z.object({
    rapido: z.object({
      enabled: z.boolean(),
      trioCount: z.number().int().min(1),
      drawCount: z.number().int().min(1),
    }),
    completo: z.object({
      enabled: z.boolean(),
      trioCount: z.number().int().min(1),
      drawCount: z.number().int().min(1),
    }),
    sala: z.object({
      enabled: z.boolean(),
      trioCount: z.number().int().min(1),
      drawCount: z.number().int().min(1),
      enableFullScreen: z.boolean(),
      enableRanking: z.boolean(),
    }),
  }),
  ui: z.object({
    theme: z.enum(["dark", "light"]),
    fontSize: z.enum(["small", "medium", "large"]),
    language: z.string(),
  }),
  disclaimer: z.object({
    text: z.string().min(1),
    alwaysVisible: z.boolean(),
  }),
})

export type DrawSimConfig = z.infer<typeof DrawSimConfigSchema>
