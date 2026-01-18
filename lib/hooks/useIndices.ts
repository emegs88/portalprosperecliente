/**
 * Hook para buscar índices financeiros (CDI, INCC, Poupança)
 * Com cache e fallback manual
 */

import { useState, useEffect } from 'react'
import { fetchCDI, fetchINCC, fetchPoupanca } from '@/lib/services/indicesService'

export interface IndicesData {
  incc: number[]
  cdi: number[]
  poupanca: number[]
  loading: boolean
  error: string | null
}

export function useIndices() {
  const [data, setData] = useState<IndicesData>({
    incc: [],
    cdi: [],
    poupanca: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    async function loadIndices() {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }))

        const [incc, cdi, poupanca] = await Promise.all([
          fetchINCC('monthly'),
          fetchCDI('monthly'),
          fetchPoupanca('monthly'),
        ])

        setData({
          incc,
          cdi,
          poupanca,
          loading: false,
          error: null,
        })
      } catch (error: any) {
        console.error('Erro ao buscar índices:', error)
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Erro ao buscar índices',
        }))
      }
    }

    loadIndices()
  }, [])

  return data
}
