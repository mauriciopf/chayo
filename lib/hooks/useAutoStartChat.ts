import { useState, useEffect } from 'react'
import { dashboardInitService } from '@/lib/services/dashboardInitService'

export interface UseAutoStartChatReturn {
  initialResponse: string | null
  isAutoStarting: boolean
  autoStartError: string | null
}

export function useAutoStartChat(
  locale: string = 'en'
): UseAutoStartChatReturn {
  const [initialResponse, setInitialResponse] = useState<string | null>(null)
  const [isAutoStarting, setIsAutoStarting] = useState(false)
  const [autoStartError, setAutoStartError] = useState<string | null>(null)

  useEffect(() => {
    const autoStartChat = async () => {
      // Always auto-start if not already started
      if (initialResponse) {
        return
      }

      try {
        setIsAutoStarting(true)
        setAutoStartError(null)

        // Call autoStartChat with empty agentId and locale
        const response = await dashboardInitService.autoStartChat(
          '', // No initial message needed
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
  }, [locale, initialResponse])

  return {
    initialResponse,
    isAutoStarting,
    autoStartError
  }
} 