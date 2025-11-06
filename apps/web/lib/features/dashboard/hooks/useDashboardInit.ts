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
  locale: string = 'es', 
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
      console.log('🚀 initializeDashboard called with:', { 
        authState, 
        user: user?.id, 
        locale 
      })
      
      // Reset state
      setError(null)
      setInitialMessage(null)
      setShouldShowAuthPrompt(false)
      
      // Handle loading state - wait for auth to resolve
      if (authState === 'loading') {
        console.log('⏳ Auth still loading, waiting...')
        setIsLoading(true)
        return
      }
      
      // Handle authenticated users - initialize full dashboard
      if (authState === 'authenticated' && user) {
        console.log('✅ Authenticated user - initializing dashboard')
        setIsLoading(true)
        
        const data = await dashboardInitService.initializeDashboard(locale)
        setInitData(data)

        const isNewUser = data.businessInfoFields.business_info_gathered === 0
        console.log(`👤 User type: ${isNewUser ? 'new' : 'existing'}`)
        
        // Generate initial message for authenticated users
        try {
          const response = await fetch('/api/organization-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [], locale })
          })
          
          if (response.ok) {
            const apiData = await response.json()
            setInitialMessage({
              content: apiData.aiMessage,
              multipleChoices: apiData.multipleChoices,
              allowMultiple: apiData.allowMultiple
            })
          } else {
            setInitialMessage({
              content: '¡Hola! Soy Chayo, tu asistente digital personalizada. Permíteme ayudarte a configurar tu negocio.'
            })
          }
        } catch (error) {
          console.error('❌ Failed to get initial message:', error)
          setInitialMessage({
            content: locale === 'es'
              ? '¡Hola! Soy Chayo, tu asistente digital personalizada. Permíteme ayudarte a configurar tu negocio.'
              : 'Hello! I\'m Chayo, your personalized digital assistant. Let me help you set up your business profile.'
          })
        }
        
        setIsLoading(false)
        return
      }
      
      // All other states (awaitingName, awaitingEmail, awaitingOTP) - show auth prompt
      console.log('🔐 Not authenticated - showing auth prompt')
      setShouldShowAuthPrompt(true)
      setInitialMessage({
        content: authPromptMessage || '¡Hola! Soy Chayo, tu asistente digital para empresas. Para comenzar, necesito que te autentiques. ¿Cuál es tu nombre?'
      })
      setIsLoading(false)
      
    } catch (err) {
      console.error('❌ Dashboard initialization failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize dashboard')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    initializeDashboard()
  }, [locale, authState, user]) // Removed authLoading dependency

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
