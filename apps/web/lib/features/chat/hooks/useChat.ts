import { useState, useEffect, useRef } from 'react'
import { Message, AuthState } from '@/lib/shared/types'

interface UseChatProps {
  authState: AuthState
  locale: string
  organizationId?: string
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
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  chatScrollContainerRef: React.RefObject<HTMLDivElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  
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
  locale,
  organizationId
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

  // Simple URL detection helper
  const detectUrlInMessage = (content: string): string | null => {
    // More robust URL regex that handles common edge cases
    const urlRegex = /https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/[^\s]*)?/i
    const match = content.match(urlRegex)
    return match ? match[0].replace(/[.,;!?]+$/, '') : null // Remove trailing punctuation
  }

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
              
              // 🌐 Handle statusSignal for website scraping (only for authenticated users)
              if (data.statusSignal === 'website_scraping_offered' && authState === 'authenticated') {
                console.log('🌐 Website scraping offered to authenticated user - sending follow-up message')
                
                // Add a follow-up message asking for the website URL
                const followUpMessage: Message = {
                  id: Date.now().toString() + '-followup',
                  role: 'ai',
                  content: "Please share your business website URL (e.g., https://yourbusiness.com) and I'll extract the information to speed up your setup. If you don't have a website, just type 'skip' and I'll guide you through our standard questions.",
                  timestamp: new Date(),
                }
                setMessages((msgs) => [...msgs, followUpMessage])
              }
              
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
        'es': 'Español'
      }
      
      const languageMessage: Message = {
        id: Date.now().toString() + '-language-change',
        role: 'system',
        content: `El idioma cambió a ${languageNames[locale as keyof typeof languageNames] || 'Español'}. Por favor continúa la conversación en ${languageNames[locale as keyof typeof languageNames] || 'Español'}.`,
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



  // Helper function to handle website scraping
  const handleWebsiteScraping = async (url: string, userMessage: Message) => {
    // Declare thinking message outside try block for error handling access
    const thinkingMessage: Message = {
      id: Date.now().toString() + '-thinking',
      role: 'ai',
      content: '🌐 Analyzing your website...',
      timestamp: new Date(),
    }
    
    try {
      console.log('🌐 Detected URL, calling website scraping API:', url)
      
      // Add user message first
      setMessages((msgs) => [...msgs, userMessage])
      setInput("")
      setJustSent(true)
      setChatLoading(true)
      
      // Get organization ID from props
      if (!organizationId) {
        throw new Error('Organization ID not found')
      }
      
      // Add thinking message
      setMessages((msgs) => [...msgs, thinkingMessage])
      
      // Update thinking message to show processing
      setTimeout(() => {
        setMessages((msgs) => msgs.map(m => 
          m.id === thinkingMessage.id 
            ? { ...m, content: '🔍 Extracting business information...' }
            : m
        ))
      }, 2000)
      
      // Call website scraping API
      const response = await fetch('/api/website-scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          organizationId: organizationId
        }),
        credentials: 'include'
      })
      
      const result = await response.json()
      
      // Remove thinking message and add result
      setMessages((msgs) => msgs.filter(m => m.id === thinkingMessage.id))
      
      const resultMessage: Message = {
        id: Date.now().toString() + '-scraping-result',
        role: 'ai',
        content: result.success 
          ? result.message 
          : `I couldn't analyze your website: ${result.error}. Let's continue with our standard setup questions.`,
        timestamp: new Date(),
      }
      setMessages((msgs) => [...msgs, resultMessage])
      
      // If scraping was successful, continue with normal chat flow
      if (result.success) {
        // Trigger normal chat flow to continue onboarding
        await handleSSERequest({
          messages: [...messages, userMessage].map(({ role, content }) => ({ 
            role: role === 'ai' ? 'assistant' : role,
            content
          })),
          locale
        }, {
          addUserMessage: false, // Already added
          logPrefix: 'Continuing after website scraping'
        })
      }
      
    } catch (error) {
      console.error('❌ Website scraping failed:', error)
      // Remove specific thinking message, not all thinking messages
      setMessages((msgs) => msgs.filter(m => m.id !== thinkingMessage.id))
      
      // Provide more specific error messages
      let errorContent = "I couldn't analyze your website. Let's continue with our standard setup questions."
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorContent = "Your website took too long to load. Let's continue with our standard setup questions."
        } else if (error.message.includes('Organization ID not found')) {
          errorContent = "There was an authentication issue. Please refresh and try again."
        }
      }
      
      const errorMessage: Message = {
        id: Date.now().toString() + '-scraping-error',
        role: 'ai',
        content: errorContent,
        timestamp: new Date(),
      }
      setMessages((msgs) => [...msgs, errorMessage])
    } finally {
      setChatLoading(false)
    }
  }

  // Send a message directly (for multiple choice responses)
  const sendMessage = async (messageContent: string) => {
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date()
    }
    
    // 🌐 Check if user wants to skip website scraping
    if ((messageContent.toLowerCase().includes('skip') || messageContent.toLowerCase().includes('no')) && authState === 'authenticated' && organizationId) {
      console.log('🌐 User chose to skip website scraping')
      
      // Call skip API
      try {
        await fetch('/api/website-scraping/skip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationId: organizationId
          }),
          credentials: 'include'
        })
      } catch (error) {
        console.error('❌ Failed to skip website scraping:', error)
      }
      
      // Add user message and continue with normal flow
      setMessages((msgs) => [...msgs, newUserMsg])
      setInput("")
      setJustSent(true)
      
      // Continue with normal chat flow
      const updatedMessages = [...messages, newUserMsg]
      await handleSSERequest({
        messages: updatedMessages.map(({ role, content }) => ({ 
          role: role === 'ai' ? 'assistant' : role,
          content
        })),
        locale
      }, {
        addUserMessage: false, // Already added
        logPrefix: 'Continuing after skipping website scraping'
      })
      return
    }
    
    // 🌐 Check if message contains a URL for website scraping (only for authenticated users)
    const detectedUrl = detectUrlInMessage(messageContent)
    if (detectedUrl && authState === 'authenticated') {
      console.log('🌐 URL detected in authenticated user message, handling website scraping')
      await handleWebsiteScraping(detectedUrl, newUserMsg)
      return
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
