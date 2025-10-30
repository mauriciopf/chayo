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
  authPromptMessage?: string,
  authLoading?: boolean
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
        authLoading, 
        locale 
      })
      
      setIsLoading(true)
      setError(null)
      setInitialMessage(null)
      setShouldShowAuthPrompt(false)
      
      // Only initialize if user is authenticated and present
      // Note: We don't wait for auth.loading because dashboardInitService fetches its own data
      if (authState === 'authenticated' && user) {
        console.log('✅ All conditions met - proceeding with dashboard initialization')
        const data = await dashboardInitService.initializeDashboard(locale)
        setInitData(data)

        // Handle initial message generation
        // Check if user has completed any onboarding (business_info_gathered > 0)
        // Note: data.business will always exist due to auto-creation trigger, 
        // so we use business_info_gathered to determine if they're actually new
        const isNewUser = data.businessInfoFields.business_info_gathered === 0
        
        if (isNewUser) {
          console.log('🆕 New user detected (business_info_gathered: 0), triggering onboarding...')
        } else {
          console.log(`👤 Existing user detected (business_info_gathered: ${data.businessInfoFields.business_info_gathered}), generating initial chat message`)
        }
        
        // Both new and existing users use the same API - the API determines the appropriate response
        try {
          const response = await fetch('/api/organization-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [], // Empty messages for initial chat
              locale: locale
            })
          })
          
          if (response.ok) {
            const apiData = await response.json()
            console.log('📊 Organization-chat API response:', { 
              userType: isNewUser ? 'new' : 'existing',
              aiMessage: apiData.aiMessage,
              aiMessageLength: apiData.aiMessage?.length,
              hasMultipleChoices: !!apiData.multipleChoices,
              allowMultiple: apiData.allowMultiple,
              fullResponse: apiData
            })
            
            // Check if we actually got a message
            if (!apiData.aiMessage || apiData.aiMessage.trim() === '') {
              console.warn('⚠️ API returned empty or null aiMessage:', apiData)
            }
            
            console.log('🔍 Setting initial message with content:', {
              content: apiData.aiMessage?.substring(0, 100) + '...',
              contentLength: apiData.aiMessage?.length,
              hasContent: !!apiData.aiMessage,
              multipleChoices: apiData.multipleChoices,
              allowMultiple: apiData.allowMultiple
            })
            
            setInitialMessage({
              content: apiData.aiMessage,
              multipleChoices: apiData.multipleChoices,
              allowMultiple: apiData.allowMultiple
            })
            console.log(`✅ Successfully generated initial message for ${isNewUser ? 'new' : 'existing'} user`)
          } else {
            console.log('❌ Organization-chat API failed, using fallback message')
            // Fallback message if API fails
            setInitialMessage({
              content: '¡Hola! Soy Chayo, tu asistente digital personalizada. Permíteme ayudarte a configurar tu negocio.'
            })
          }
        } catch (error) {
          console.error('❌ Failed to get initial message:', error)
          // Fallback message
          setInitialMessage({
            content: locale === 'es'
              ? '¡Hola! Soy Chayo, tu asistente digital personalizada. Permíteme ayudarte a configurar tu negocio.'
              : 'Hello! I\'m Chayo, your personalized digital assistant. Let me help you set up your business profile.'
          })
        }
        console.log('✅ Dashboard initialization complete')
        setIsLoading(false)
      } else if (authState !== 'loading' && !user) {
        console.log('🔐 User not authenticated, showing auth prompt')
        // Only show auth prompt if not loading and no user
        setShouldShowAuthPrompt(true)
        setInitialMessage({
          content: authPromptMessage || '¡Hola! Soy Chayo, tu asistente digital para empresas. Para comenzar, necesito que te autentiques. ¿Cuál es tu nombre?'
        })
        setIsLoading(false)
      } else {
        console.log('⏳ Conditions not met for initialization:', { 
          authState, 
          hasUser: !!user
        })
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
