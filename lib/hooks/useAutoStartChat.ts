import { useState, useEffect } from 'react'
import { dashboardInitService } from '@/lib/services/dashboardInitService'

export interface UseAutoStartChatReturn {
  initialResponse: string | null
  isAutoStarting: boolean
  autoStartError: string | null
}

export function useAutoStartChat(
  locale: string = 'en',
  dashboardReady: boolean
): UseAutoStartChatReturn {
  const [initialResponse, setInitialResponse] = useState<string | null>(null)
  const [isAutoStarting, setIsAutoStarting] = useState(false)
  const [autoStartError, setAutoStartError] = useState<string | null>(null)

  useEffect(() => {
    const autoStartChat = async () => {
      if (!dashboardReady || initialResponse) {
        return
      }
      try {
        setIsAutoStarting(true)
        setAutoStartError(null)
        const response = await dashboardInitService.autoStartChat(
          '',
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
    autoStartChat()
  }, [locale, dashboardReady, initialResponse])

  return {
    initialResponse,
    isAutoStarting,
    autoStartError
  }
} 