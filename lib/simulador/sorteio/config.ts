import { DrawSimConfig, DrawSimConfigSchema } from '@/schemas/drawSimConfig'
import defaultConfig from '@/config/drawSimConfig.json'

const CONFIG_STORAGE_KEY = 'prospere_draw_sim_config'

/**
 * Carregar config padrão
 */
export function loadDefaultConfig(): DrawSimConfig {
  return DrawSimConfigSchema.parse(defaultConfig)
}

/**
 * Carregar config do LocalStorage
 */
export function loadConfig(): DrawSimConfig {
  if (typeof window === 'undefined') {
    return loadDefaultConfig()
  }

  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (!stored) {
      return loadDefaultConfig()
    }

    const parsed = JSON.parse(stored)
    return DrawSimConfigSchema.parse(parsed)
  } catch (error) {
    console.error('Error loading config:', error)
    return loadDefaultConfig()
  }
}

/**
 * Salvar config no LocalStorage
 */
export function saveConfig(config: DrawSimConfig): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const validated = DrawSimConfigSchema.parse(config)
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(validated))
  } catch (error) {
    console.error('Error saving config:', error)
    throw new Error('Configuração inválida')
  }
}

/**
 * Validar config
 */
export function validateConfig(config: unknown): DrawSimConfig {
  return DrawSimConfigSchema.parse(config)
}
