'use client'

import { useState, useEffect } from 'react'
import { Message, Agent, Organization } from '@/lib/shared/types'
import { supabase } from '@/lib/shared/supabase/client'

interface UseClientModeChatProps {
  agent: Agent
  organization: Organization
  locale?: string
}

export function useClientModeChat({
  agent,
  organization,
  locale = 'es'
}: UseClientModeChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [anonymousUser, setAnonymousUser] = useState<any>(null)

  // Setup anonymous session for persistence (document signing, form submissions, etc.)
  const setupAnonymousSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) {
          console.error('Error creating anonymous session:', error)
        } else if (data.user) {
          setAnonymousUser(data.user)
          console.log('Created persistent anonymous session:', data.user.id)
        }
      } else {
        setAnonymousUser(user)
        console.log('Using existing anonymous session:', user.id)
      }
    } catch (error) {
      console.error('Error setting up anonymous session:', error)
    }
  }

  // Initialize with greeting message
  useEffect(() => {
    const initializeMessages = async () => {
      if (!anonymousUser) {
        await setupAnonymousSession()
      }

      if (messages.length === 0) {
        const greeting: Message = {
          id: 'greeting',
          content: `¡Hola! Soy ${agent.name || 'el asistente'} de ${organization.name}. ¿En qué puedo ayudarte hoy?`,
          role: 'ai',
          timestamp: new Date()
        }
        setMessages([greeting])
      }
    }

    initializeMessages()
  }, [agent.name, organization.name, anonymousUser, messages.length])

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || loading) return

    setLoading(true)
    setError(null)
    setInput('')

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      role: 'user',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // Call client chat API with function calling support
      const response = await fetch('/api/client-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          organizationId: organization.id,
          locale,
          messages: messages.map(m => ({
            role: m.role === 'ai' ? 'assistant' : m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje')
      }

      const data = await response.json()

      // Add AI response
      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        content: data.response,
        role: 'ai',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Log function calls for debugging
      if (data.functionCalls && data.functionCalls.length > 0) {
        console.log('🔧 Function calls executed:', data.functionCalls.map((fc: any) => fc.name))
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('No se pudo enviar el mensaje. Por favor intenta de nuevo.')
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  return {
    messages,
    input,
    setInput,
    loading,
    error,
    sendMessage,
    handleKeyPress,
    clearChat,
    anonymousUser
  }
}
