import { useEffect, useRef } from 'react'

interface InitialMessageSource {
  message: string | null | undefined
  id: string
  priority: number // Higher number = higher priority
}

interface UseInitialChatMessageProps {
  messageSources: InitialMessageSource[]
  messagesLength: number
  locale: string | null | undefined
  setMessages: (messages: any[] | ((prev: any[]) => any[])) => void
}

// Shared state to track if any initial message has been set
let globalInitialMessageSet = false

export function useInitialChatMessage({
  messageSources,
  messagesLength,
  locale,
  setMessages
}: UseInitialChatMessageProps) {
  const hasSetInitialMessage = useRef(false)

  useEffect(() => {
    if (messagesLength === 0 && locale && !globalInitialMessageSet && !hasSetInitialMessage.current) {
      // Find the highest priority message source that has a message
      const availableSources = messageSources
        .filter(source => source.message)
        .sort((a, b) => b.priority - a.priority) // Sort by priority (highest first)

      if (availableSources.length > 0) {
        const selectedSource = availableSources[0]
        globalInitialMessageSet = true
        hasSetInitialMessage.current = true
        
        const sendInitialMessage = async () => {
          try {
            const response = await fetch('/api/organization-chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: [
                  {
                    role: 'user',
                    content: 'Start the conversation'
                  }
                ],
                locale
              })
            })
            
            if (response.ok) {
              const data = await response.json()
              setMessages([
                {
                  id: selectedSource.id + '-' + Date.now(),
                  role: 'ai',
                  content: data.aiMessage,
                  timestamp: new Date(),
                  multipleChoices: data.multipleChoices,
                  allowMultiple: data.allowMultiple,
                  showOtherOption: data.showOtherOption
                }
              ])
            } else {
              // Fallback to plain text if API fails
              setMessages([
                {
                  id: selectedSource.id + '-' + Date.now(),
                  role: 'ai',
                  content: selectedSource.message,
                  timestamp: new Date(),
                }
              ])
            }
          } catch (error) {
            console.error('Failed to get initial message from API:', error)
            // Fallback to plain text if API fails
            setMessages([
              {
                id: selectedSource.id + '-' + Date.now(),
                role: 'ai',
                content: selectedSource.message,
                timestamp: new Date(),
              }
            ])
          }
        }
        
        sendInitialMessage()
      }
    }
  }, [messageSources, messagesLength, locale, setMessages])

  // Reset the flag when messages change (in case we need to set a new initial message)
  useEffect(() => {
    if (messagesLength > 0) {
      globalInitialMessageSet = false
      hasSetInitialMessage.current = false
    }
  }, [messagesLength])
} 