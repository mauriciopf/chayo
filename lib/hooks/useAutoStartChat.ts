import { useState, useEffect } from 'react'
import { dashboardInitService } from '@/lib/services/dashboardInitService'

export interface UseAutoStartChatReturn {
  initialResponse: string | null
  isAutoStarting: boolean
  autoStartError: string | null
}

export function useAutoStartChat(
  agentId: string | null,
  shouldAutoStart: boolean,
  initialMessage: string | undefined,
  locale: string = 'en',
  isReady: boolean = true // New parameter to ensure all dependencies are loaded
): UseAutoStartChatReturn {
  const [initialResponse, setInitialResponse] = useState<string | null>(null)
  const [isAutoStarting, setIsAutoStarting] = useState(false)
  const [autoStartError, setAutoStartError] = useState<string | null>(null)

  useEffect(() => {
    const autoStartChat = async () => {
      // Wait for all conditions to be met
      if (!shouldAutoStart || !agentId || !initialMessage || initialResponse || !isReady) {
        return // Don't auto-start if conditions not met or already started
      }

      try {
        setIsAutoStarting(true)
        setAutoStartError(null)
        
        const response = await dashboardInitService.autoStartChat(
          agentId,
          initialMessage,
          locale
        )
        
        if (response) {
          setInitialResponse(response)
        } else {
          setAutoStartError('No response received from auto-start')
        }
      } catch (err) {
        console.error('Failed to auto-start chat:', err)
        setAutoStartError(err instanceof Error ? err.message : 'Failed to auto-start chat')
      } finally {
        setIsAutoStarting(false)
      }
    }

    // Add a delay to ensure all dependencies are stable
    const timeoutId = setTimeout(autoStartChat, 1500)
    
    return () => clearTimeout(timeoutId)
  }, [agentId, shouldAutoStart, initialMessage, locale, initialResponse, isReady])

  return {
    initialResponse,
    isAutoStarting,
    autoStartError
  }
} 