'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatMessage from './ChatMessage'
import { Message, Agent, Organization } from './types'
import { supabase } from '@/lib/supabase/client'

interface ClientChatContainerProps {
  agent: Agent
  organization: Organization
  locale?: string
  className?: string
}

export default function ClientChatContainer({ agent, organization, locale = 'en', className = '' }: ClientChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatScrollContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initial greeting message with service options
  useEffect(() => {
    const initializeMessages = async () => {
      if (agent && organization) {
        const welcomeMessage: Message = {
          id: 'welcome',
          content: `¡Hola! Soy Chayo, tu asistente digital para ${organization.name}. ¿En qué puedo ayudarte hoy?`,
          role: 'ai',
          timestamp: new Date()
        }
        
        const initialMessages: Message[] = [welcomeMessage]

        // Check if agent tools are enabled
        try {
          const response = await fetch(`/api/organizations/${organization.id}/agent-tools`)
          if (response.ok) {
            const agentTools = await response.json()
            
            // Add appointment message if appointments tool is enabled
            if (agentTools.appointments) {
              const appointmentMessage: Message = {
                id: 'appointment-option',
                content: `📅 **Agendar una cita**\n\n¿Necesitas agendar una cita? Haz clic en el botón de abajo para ver nuestro calendario disponible y reservar tu horario.`,
                role: 'ai',
                timestamp: new Date(),
                appointmentLink: `http://localhost:3000/${locale}/book-appointment/${organization.slug}`
              }
              initialMessages.push(appointmentMessage)
            }

            // Add document signing message if documents tool is enabled and there are active documents
            if (agentTools.documents) {
              try {
                // Fetch available documents
                const documentsResponse = await fetch(`/api/organizations/${organization.id}/agent-documents/upload`)
                if (documentsResponse.ok) {
                  const documentsData = await documentsResponse.json()
                  const documents = documentsData.documents || []
                  
                  // Show all active documents (documents are always available for signing now)
                  const activeDocuments = documents.filter((doc: any) => doc.status === 'active')
                  
                  if (activeDocuments.length > 0) {
                    // Show the most recent active document
                    const activeDocument = activeDocuments[0]
                    
                    const documentMessage: Message = {
                      id: 'document-option',
                      content: `📝 **Firmar documento**\n\n¿Necesitas firmar el documento "${activeDocument.file_name}"? Haz clic en el botón de abajo para acceder al proceso de firma.`,
                      role: 'ai',
                      timestamp: new Date(),
                      documentSigningLink: activeDocument.signing_url
                    }
                    initialMessages.push(documentMessage)
                  }
                  // Note: Documents are always available for signing with the new approach
                }
              } catch (error) {
                console.error('Error fetching documents:', error)
                // Don't show document option if there's an error
              }
            }
          }
        } catch (error) {
          console.error('Error fetching agent tools:', error)
          // Fallback: Always show appointment option
          const appointmentMessage: Message = {
            id: 'appointment-option',
            content: `📅 **Agendar una cita**\n\n¿Necesitas agendar una cita? Haz clic en el botón de abajo para ver nuestro calendario disponible y reservar tu horario.`,
            role: 'ai',
            timestamp: new Date(),
            appointmentLink: `http://localhost:3000/${locale}/book-appointment/${organization.slug}`
          }
          initialMessages.push(appointmentMessage)
        }
        
        setMessages(initialMessages)
      }
    }

    initializeMessages()
  }, [agent, organization, locale])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      // Call the client chat API endpoint with locale support
      const response = await fetch('/api/client-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          organizationId: organization.id,
          locale: locale, // Include locale for internationalization
          messages: messages.slice(-10) // Send last 10 messages for context
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        content: data.response,
        role: 'ai',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`flex flex-col h-full w-full ${className}`}>
      {/* Messages Area - Full Screen Mobile */}
      <div 
        ref={chatScrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ChatMessage 
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                appointmentLink={message.appointmentLink}
                documentSigningLink={message.documentSigningLink}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start px-4 py-2"
          >
            <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message - Mobile Full Width */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Input Area - Mobile Optimized Full Width */}
      <div className="border-t border-gray-200 bg-white">
        <div className="px-4 py-3 safe-area-inset-bottom">
          <div className="flex gap-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium touch-manipulation min-h-[44px] flex items-center"
            >
              {loading ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 