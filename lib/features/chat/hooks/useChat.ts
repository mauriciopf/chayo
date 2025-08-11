import { useState, useEffect, useRef } from 'react'
import { Message, AuthState } from '@/lib/shared/types'

interface UseChatProps {
  authState: AuthState
  locale: string
}

interface UseChatReturn {
  // State
  messages: Message[]
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  input: string
  setInput: (input: string) => void
  chatLoading: boolean
  setChatLoading: (loading: boolean) => void
  chatError: string | null
  setChatError: (error: string | null) => void
  justSent: boolean
  setJustSent: (sent: boolean) => void
  uploading: boolean
  setUploading: (uploading: boolean) => void
  uploadProgress: number | null
  setUploadProgress: (progress: number | null) => void
  currentPhase: string | null
  
  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement>
  inputRef: React.RefObject<HTMLTextAreaElement>
  chatScrollContainerRef: React.RefObject<HTMLDivElement>
  fileInputRef: React.RefObject<HTMLInputElement>
  
  // Methods
  scrollToShowUserMessage: (smooth?: boolean) => void
  handleInputFocus: () => void
  handleSend: () => Promise<void>
  sendMessage: (messageContent: string) => Promise<void>
  triggerSSEWithEmptyMessages: () => Promise<void>
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
}

export function useChat({
  authState,
  locale
}: UseChatProps): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [justSent, setJustSent] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [previousLocale, setPreviousLocale] = useState<string>(locale)
  const [currentPhase, setCurrentPhase] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatScrollContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reusable SSE handler
  const handleSSERequest = async (requestBody: any, options: {
    addUserMessage?: boolean
    userMessage?: Message
    logPrefix?: string
  } = {}) => {
    if (chatLoading) return
    
    setChatError(null)
    setChatLoading(true)
    
    // Add user message if specified
    if (options.addUserMessage && options.userMessage) {
      const updatedMessages = [...messages, options.userMessage]
      setMessages(updatedMessages)
      setInput("")
      setJustSent(true)
      
      // Close keyboard on mobile devices
      if (inputRef.current) {
        inputRef.current.blur()
      }
    }
    
    try {
      console.log(`🚀 ${options.logPrefix || 'Starting SSE request'}`)
      
      const streamRes = await fetch('/api/organization-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      })

      if (!streamRes.ok || !streamRes.body) {
        try {
          const data = await streamRes.json()
          setChatError(data.error || 'Error processing request')
        } catch {
          setChatError('Error processing request')
        }
        setChatLoading(false)
        return
      }

      const reader = streamRes.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      
      const processBuffer = () => {
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''
        for (const evt of events) {
          const lines = evt.split('\n')
          let eventName = 'message'
          let dataLine = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) eventName = line.slice(7)
            if (line.startsWith('data: ')) dataLine += line.slice(6)
          }
          if (eventName === 'phase') {
            try {
              const data = JSON.parse(dataLine)
              console.log('📡 SSE Phase:', data?.name)
              setCurrentPhase(data?.name || null)
            } catch {}
          } else if (eventName === 'result') {
            try {
              const data = JSON.parse(dataLine)
              console.log('🤖 SSE AI response received')
              const aiMessage: Message = {
                id: Date.now().toString() + '-ai',
                role: 'ai',
                content: data.aiMessage,
                timestamp: new Date(),
                multipleChoices: data.multipleChoices,
                allowMultiple: data.allowMultiple,
                // Add tool suggestion metadata if present
                isToolSuggestion: data.suggestionMeta?.isToolSuggestion,
                toolName: data.suggestionMeta?.toolName
              }
              setMessages((msgs) => [...msgs, aiMessage])
              // Delay clearing the phase to allow switchingMode effects to trigger
              setTimeout(() => {
                setCurrentPhase(null)
              }, 1000)
            } catch (e) {
              console.error('Failed to parse result data', e)
            }
          } else if (eventName === 'error') {
            try {
              const err = JSON.parse(dataLine)
              setChatError(err.message || 'Error')
            } catch {
              setChatError('Error')
            }
          }
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        processBuffer()
      }
    } catch (err) {
      console.error('SSE request failed:', err)
      setChatError('Failed to process request. Please try again.')
    } finally {
      setChatLoading(false)
      setCurrentPhase(null)
    }
  }

  // Scroll functionality - only scroll to bottom for new user messages, not AI responses
  const scrollToShowUserMessage = (smooth = true) => {
    // Only auto-scroll for user messages, let AI responses stay where they are
    // This allows users to scroll up and read previous messages without interruption
    requestAnimationFrame(() => {
      if (chatScrollContainerRef.current) {
        // Check if user is near the bottom before auto-scrolling
        const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100 // Within 100px of bottom
        
        if (isNearBottom) {
          chatScrollContainerRef.current.scrollTo({
            top: chatScrollContainerRef.current.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
          })
        }
      }
    })
  }

  // Only scroll when user sends a message (justSent is true)
  useEffect(() => {
    if (justSent) {
      scrollToShowUserMessage()
      setJustSent(false)
    }
  }, [justSent])

  // Detect locale changes and notify AI
  useEffect(() => {
    if (previousLocale !== locale && messages.length > 0) {
      const languageNames = {
        'en': 'English',
        'es': 'Spanish (Español)'
      }
      
      const languageMessage: Message = {
        id: Date.now().toString() + '-language-change',
        role: 'system',
        content: `Language switched to ${languageNames[locale as keyof typeof languageNames] || locale}. Please continue the conversation in ${languageNames[locale as keyof typeof languageNames] || locale}.`,
        timestamp: new Date(),
      }

      setMessages((msgs) => [...msgs, languageMessage])
      setPreviousLocale(locale)
      setJustSent(true) // Trigger scroll to show the language change
    }
  }, [locale, previousLocale, messages.length])

  // Handle input focus on mobile
  const handleInputFocus = () => {
    // Let the browser handle keyboard positioning naturally
    // Input is already correctly positioned with flexbox layout
  }

  // Send a message directly (for multiple choice responses)
  const sendMessage = async (messageContent: string) => {
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date()
    }
    
    // Create the updated messages array that includes the new user message
    const updatedMessages = [...messages, newUserMsg]
    console.log('💬 Sending message:', {
      userMessage: messageContent,
      totalMessagesAfter: updatedMessages.length,
      conversationLength: updatedMessages.map(m => `${m.role}: ${m.content.substring(0, 30)}...`).join(' | ')
    })
    
    await handleSSERequest({
      messages: updatedMessages.map(({ role, content }) => ({ 
        role: role === 'ai' ? 'assistant' : role,
        content
      })),
      locale
    }, {
      addUserMessage: true,
      userMessage: newUserMsg,
      logPrefix: 'Starting SSE request'
    })
  }

  // Trigger SSE with empty messages array (for auth/onboarding context switching)
  const triggerSSEWithEmptyMessages = async () => {
    await handleSSERequest({
      messages: [], // Empty messages array for SSE trigger
      locale
    }, {
      logPrefix: 'Starting SSE request with empty messages for context switch'
    })
  }

  // Handle sending messages
  const handleSend = async () => {
    if (authState !== 'authenticated') {
      // OTP flow is handled directly in ChatContainer
      return
    }
    if (!input.trim() || chatLoading) return
    
    await sendMessage(input)
  }

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setChatError(null)

    // Show a message in the chat that the file is being uploaded
    setMessages((msgs) => [
      ...msgs,
      {
        id: Date.now().toString() + '-file',
        role: 'user',
        content: `Uploading file: ${file.name}`,
        timestamp: new Date()
      }
    ])

    // Upload the file to the backend
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!res.ok) {
        setChatError('File upload failed')
        setUploading(false)
        setUploadProgress(null)
        return
      }
      const data = await res.json()
      setMessages((msgs) => [
        ...msgs,
        {
          id: Date.now().toString() + '-file-success',
          role: 'user',
          content: `Uploaded file: ${file.name}`,
          timestamp: new Date()
        }
      ])
    } catch (err) {
      setChatError('File upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return {
    // State
    messages,
    setMessages,
    input,
    setInput,
    chatLoading,
    setChatLoading,
    chatError,
    setChatError,
    justSent,
    setJustSent,
    uploading,
    setUploading,
    uploadProgress,
    setUploadProgress,
    currentPhase,
    
    // Refs
    messagesEndRef,
    inputRef,
    chatScrollContainerRef,
    fileInputRef,
    
    // Methods
    scrollToShowUserMessage,
    handleInputFocus,
    handleSend,
    sendMessage,
    triggerSSEWithEmptyMessages,
    handleFileChange,
  }
} 