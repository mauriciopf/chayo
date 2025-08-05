import { useState, useEffect } from 'react'
import { dashboardInitService, DashboardInitData } from '../services/dashboardInitService'
import { AuthState } from '@/lib/shared/types'

export interface UseDashboardInitReturn {
  initData: DashboardInitData | null
  isLoading: boolean
  error: string | null
  retryInit: () => void
  initialMessage?: {
    content: string
    multipleChoices?: string[]
    allowMultiple?: boolean
  } | null
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
  const [initialMessage, setInitialMessage] = useState<{
    content: string
    multipleChoices?: string[]
    allowMultiple?: boolean
  } | null>(null)
  const [shouldShowAuthPrompt, setShouldShowAuthPrompt] = useState(false)

  const initializeDashboard = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setInitialMessage(null)
      setShouldShowAuthPrompt(false)
      
      // Only initialize if user is authenticated and present
      if (authState === 'authenticated' && user) {
        const data = await dashboardInitService.initializeDashboard(locale)
        setInitData(data)

        // Always generate the initial chat message for authenticated users
        // This will either be an onboarding question or a proper business introduction
        const msg = await dashboardInitService.generateInitialChatMessage(data.business, locale)
        setInitialMessage(msg)
        setIsLoading(false)
      } else if (authState !== 'loading' && !user) {
        // Only show auth prompt if not loading and no user
        setShouldShowAuthPrompt(true)
        setInitialMessage({
          content: authPromptMessage || (locale === 'es' 
            ? "¡Hola! Soy Chayo, tu asistente digital para empresas. Para comenzar, necesito que te autentiques. ¿Cuál es tu nombre?"
            : "Hello! I'm Chayo, your digital business assistant. To get started, I need you to authenticate. What's your name?")
        })
        setIsLoading(false)
      } else {
        // Still loading
        setIsLoading(true)
      }
    } catch (err) {
      console.error('❌ Dashboard initialization failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize dashboard')
      setIsLoading(false)
    }
  }

  useEffect(() => {
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