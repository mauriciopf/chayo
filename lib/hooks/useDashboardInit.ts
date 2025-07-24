import { useState, useEffect } from 'react'
import { dashboardInitService, DashboardInitData } from '@/lib/services/dashboardInitService'
import { AuthState } from '@/components/dashboard/types'

export interface UseDashboardInitReturn {
  initData: DashboardInitData | null
  isLoading: boolean
  error: string | null
  retryInit: () => void
  initialMessage?: string | null
  shouldShowAuthPrompt: boolean
}

export function useDashboardInit(
  locale: string = 'en', 
  authState: AuthState, 
  user: any,
  authPromptMessage?: string
): UseDashboardInitReturn {
  const [initData, setInitData] = useState<DashboardInitData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialMessage, setInitialMessage] = useState<string | null>(null)
  const [shouldShowAuthPrompt, setShouldShowAuthPrompt] = useState(false)

  const initializeDashboard = async () => {
    console.log('🔄 Dashboard init - Starting with:', { authState, user: user?.id, locale })
    
    try {
      setIsLoading(true)
      setError(null)
      setInitialMessage(null)
      setShouldShowAuthPrompt(false)
      
      // Don't show auth prompt while loading
      if (authState === 'loading') {
        console.log('⏳ Dashboard init - Still loading, waiting...')
        setIsLoading(false)
        return
      }
      
      // Only show auth prompt if user is definitely not authenticated
      if (authState === 'awaitingName' && user === null) {
        console.log('👤 Dashboard init - Showing auth prompt for unauthenticated user')
        setShouldShowAuthPrompt(true)
        setInitialMessage(authPromptMessage || "Hi there! What's your name? (First name only is fine)")
        setIsLoading(false)
        return
      }

      // Handle authenticated users - initialize dashboard
      if (authState === 'authenticated' && user) {
        console.log('🔄 Dashboard init - Starting dashboard initialization for authenticated user')
        const data = await dashboardInitService.initializeDashboard(locale)
        setInitData(data)
        console.log('✅ Dashboard init - Dashboard initialization successful')

        // If there are no business info fields gathered, generate the initial chat message
        if (data.business && data.businessInfoFields?.business_info_gathered === 0) {
          const msg = await dashboardInitService.generateInitialChatMessage(data.business, locale)
          setInitialMessage(msg)
        }
      } else {
        console.log('⚠️ Dashboard init - Unexpected state:', { authState, user: user?.id })
      }
    } catch (err) {
      console.error('❌ Dashboard initialization failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('🔄 Dashboard init - useEffect triggered:', { authState, user: user?.id, locale })
    initializeDashboard()
  }, [locale, authState, user])

  const retryInit = () => {
    initializeDashboard()
  }

  return {
    initData,
    isLoading,
    error,
    retryInit,
    initialMessage,
    shouldShowAuthPrompt
  }
} 