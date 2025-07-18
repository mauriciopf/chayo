import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message, Agent, AuthState } from '../types'

interface UseChatProps {
  authState: AuthState
  selectedAgent: Agent | null
  setSelectedAgent: (agent: Agent | null) => void
  user: any
  isMobile: boolean
  pendingName: string
  pendingEmail: string
  otpLoading: string
  setOtpError: (error: string | null) => void
  setOtpSent: (sent: boolean) => void
  setResendCooldown: (cooldown: number) => void
  setAuthState: (state: AuthState) => void
  locale: string
}

export function useChat({
  authState,
  selectedAgent,
  setSelectedAgent,
  user,
  isMobile,
  pendingName,
  pendingEmail,
  otpLoading,
  setOtpError,
  setOtpSent,
  setResendCooldown,
  setAuthState,
  locale
}: UseChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [justSent, setJustSent] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [previousLocale, setPreviousLocale] = useState<string>(locale)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatScrollContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

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

  // Auto-start authentication flow and clear welcome message when authenticated
  useEffect(() => {
    if (authState !== 'authenticated' && messages.length === 0 && user === null) {
      setMessages([
        {
          id: Date.now().toString(),
          role: 'ai',
          content: "Hi there! What's your name? (First name only is fine)",
          timestamp: new Date(),
        },
      ])
    } else if (authState === 'authenticated' && user) {
      // Clear the welcome message when user becomes authenticated
      // Only clear if the only message is the initial welcome message
      if (messages.length === 1 && 
          messages[0].role === 'ai' && 
          messages[0].content.includes("Hi there! What's your name?")) {
        setMessages([])
      }
    }
  }, [authState, messages.length, user])

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

  // Handle sending messages
  const handleSend = async () => {
    if (authState !== 'authenticated') {
      // OTP flow is handled directly in ChatContainer
      return
    }
    if (!input.trim() || chatLoading) return
    
    setChatError(null)
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    }
    
    setMessages((msgs) => [...msgs, newUserMsg])
    setInput("")
    setJustSent(true) // Set justSent to trigger scroll after DOM update
    
    // Close keyboard on mobile devices
    if (isMobile && inputRef.current) {
      inputRef.current.blur()
    }
    
    setChatLoading(true)
    
    try {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(session?.access_token && { "Authorization": `Bearer ${session.access_token}` })
        },
        body: JSON.stringify({
          messages: [...messages, newUserMsg].map(({ role, content }) => ({ 
            role: role === "ai" ? "assistant" : role, 
            content 
          })),
          locale,
          ...(selectedAgent && { agentId: selectedAgent.id })
        })
      })
      
      if (!res.ok) {
        const data = await res.json()
        setChatError(data.error || "Error sending message")
        setChatLoading(false)
        return
      }
      
      const data = await res.json()
      
      if (data.agent && !selectedAgent) {
        setSelectedAgent(data.agent)
      }
      
      setMessages((msgs) => [
        ...msgs,
        { 
          id: Date.now().toString() + "-ai", 
          role: "ai", 
          content: data.aiMessage,
          timestamp: new Date(),
          usingRAG: data.usingRAG
        }
      ])
    } catch (err) {
      setChatError("Error sending message")
    } finally {
      setChatLoading(false)
    }
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
    
    // Refs
    messagesEndRef,
    inputRef,
    chatScrollContainerRef,
    fileInputRef,
    
    // Methods
    scrollToShowUserMessage,
    handleInputFocus,
    handleSend,
    handleFileChange,
  }
} 