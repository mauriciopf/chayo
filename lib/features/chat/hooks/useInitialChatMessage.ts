import { useEffect, useRef } from 'react'

interface UseInitialChatMessageProps {
  message: {
    content: string
    multipleChoices?: string[]
    allowMultiple?: boolean
    showOtherOption?: boolean
  } | null | undefined
  messagesLength: number
  locale: string | null | undefined
  setMessages: (messages: any[] | ((prev: any[]) => any[])) => void
}

export function useInitialChatMessage({
  message,
  messagesLength,
  locale,
  setMessages
}: UseInitialChatMessageProps) {
  const hasSetInitialMessage = useRef(false)

  useEffect(() => {
    if (messagesLength === 0 && locale && message && !hasSetInitialMessage.current) {
      hasSetInitialMessage.current = true
      
      // Use the pre-generated message directly instead of calling the API
      setMessages([
        {
          id: 'initial-' + Date.now(),
          role: 'ai',
          content: message.content,
          timestamp: new Date(),
          multipleChoices: message.multipleChoices,
          allowMultiple: message.allowMultiple,
          showOtherOption: message.showOtherOption
        }
      ])
    }
  }, [message, messagesLength, locale, setMessages])

  // Reset the flag when messages change (in case we need to set a new initial message)
  useEffect(() => {
    if (messagesLength > 0) {
      hasSetInitialMessage.current = false
    }
  }, [messagesLength])
} 