import { useState, useEffect } from 'react'
import { dashboardInitService, DashboardInitData } from '@/lib/services/dashboardInitService'

export interface UseDashboardInitReturn {
  initData: DashboardInitData | null
  isLoading: boolean
  error: string | null
  retryInit: () => void
  initialMessage?: string | null
}

export function useDashboardInit(locale: string = 'en'): UseDashboardInitReturn {
  const [initData, setInitData] = useState<DashboardInitData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialMessage, setInitialMessage] = useState<string | null>(null)

  const initializeDashboard = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setInitialMessage(null)
      
      console.log('🔄 Starting dashboard initialization...')
      const data = await dashboardInitService.initializeDashboard(locale)
      setInitData(data)
      console.log('✅ Dashboard initialization successful')

      // If there are no business info fields gathered, generate the initial chat message
      if (data.business && data.businessInfoFields?.business_info_gathered === 0) {
        const msg = await dashboardInitService.generateInitialChatMessage(data.business, locale)
        setInitialMessage(msg)
      }
    } catch (err) {
      console.error('❌ Dashboard initialization failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    initializeDashboard()
  }, [locale])

  const retryInit = () => {
    initializeDashboard()
  }

  return {
    initData,
    isLoading,
    error,
    retryInit,
    initialMessage
  }
} 