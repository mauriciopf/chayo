import { useEffect, useRef } from 'react'

interface UseInitialChatMessageProps {
  message: {
    content: string
    multipleChoices?: string[]
    allowMultiple?: boolean
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
    console.log('🎬 useInitialChatMessage effect triggered:', {
      messagesLength,
      hasLocale: !!locale,
      hasMessage: !!message,
      messageContent: message?.content?.substring(0, 50) + '...',
      hasSetInitialMessage: hasSetInitialMessage.current
    })
    
    if (messagesLength === 0 && locale && message && message.content && !hasSetInitialMessage.current) {
      console.log('✅ Setting initial chat message:', {
        content: message.content.substring(0, 100) + '...',
        hasMultipleChoices: !!message.multipleChoices
      })
      
      hasSetInitialMessage.current = true
      
      // Use the pre-generated message directly instead of calling the API
      setMessages([
        {
          id: 'initial-' + Date.now(),
          role: 'ai',
          content: message.content,
          timestamp: new Date(),
          multipleChoices: message.multipleChoices,
          allowMultiple: message.allowMultiple
        }
      ])
    } else {
      console.log('❌ Skipping initial message:', {
        messagesLength,
        hasLocale: !!locale,
        hasMessage: !!message,
        hasContent: !!message?.content,
        alreadySet: hasSetInitialMessage.current
      })
    }
  }, [message, messagesLength, locale, setMessages])

  // Reset the flag when messages change (in case we need to set a new initial message)
  useEffect(() => {
    if (messagesLength > 0) {
      hasSetInitialMessage.current = false
    }
  }, [messagesLength])
} 