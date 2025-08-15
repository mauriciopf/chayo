'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'

export type ActionableHint = {
  id: string
  label: string
  icon: string
  description: string
  category: 'appointments' | 'documents' | 'payments' | 'intake_forms' | 'faqs'
}

interface ActionableHintChipsProps {
  onHintSelect: (hint: ActionableHint) => void
  organizationId: string
  className?: string
}

type AgentToolSettings = {
  [key in ActionableHint['category']]: boolean
}

const ActionableHintChips: React.FC<ActionableHintChipsProps> = ({ 
  onHintSelect,
  organizationId,
  className = ''
}) => {
  const t = useTranslations('chat')

  const [agentToolSettings, setAgentToolSettings] = useState<AgentToolSettings>({
    appointments: false,
    documents: false,
    payments: false,
    intake_forms: false,
    faqs: false
  })

  // Define the actionable hints
  const actionableHints: ActionableHint[] = [
    {
      id: 'schedule_appointment',
      label: '📅 Schedule appointment',
      icon: '📅',
      description: 'Book a meeting, reservation, or service time slot.',
      category: 'appointments'
    },
    {
      id: 'share_document',
      label: '📝 Share document',
      icon: '📝',
      description: 'Send intake forms, agreements, or information sheets.',
      category: 'documents'
    },
    {
      id: 'collect_payment',
      label: '💳 Collect payment',
      icon: '💳',
      description: 'Send a payment link or confirm payment details.',
      category: 'payments'
    },
    {
      id: 'collect_intake_form',
      label: '📋 Intake form',
      icon: '📋',
      description: 'Send custom forms to collect client information, preferences, or requirements.',
      category: 'intake_forms'
    },
    {
      id: 'answer_faqs',
      label: '❓ Answer FAQ',
      icon: '❓',
      description: 'Business hours, location, pricing, policies.',
      category: 'faqs'
    }
  ]





  // Load agent tool settings on component mount
  useEffect(() => {
    if (organizationId) {
      loadAgentToolSettings()
    }
  }, [organizationId])

  const loadAgentToolSettings = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/agent-tools`)
      if (response.ok) {
        const settings = await response.json()

        setAgentToolSettings(settings)
      }
    } catch (error) {
      console.error('Error loading agent tool settings:', error)
    }
  }

  const handleHintClick = (hint: ActionableHint) => {
    // Always open the modal when a hint is clicked
    onHintSelect(hint)
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Simple Horizontal Scroll Container */}
      <div 
        className="flex gap-3 overflow-x-auto overflow-y-hidden pb-3 px-1"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
          {/* Hint Chips */}
          <AnimatePresence>
            {actionableHints.map((hint, index) => (
              <motion.button
                key={hint.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ 
                  delay: index * 0.05,
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1]
                }}
                onClick={() => handleHintClick(hint)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium group relative overflow-hidden whitespace-nowrap ${
                  agentToolSettings[hint.category]
                    ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-200 ring-offset-2 cursor-pointer'
                    : 'bg-gray-900 border border-gray-700 text-gray-300 cursor-pointer opacity-80 hover:opacity-100 hover:bg-gray-800 hover:text-gray-200 hover:border-amber-400/60 hover:ring-1 hover:ring-amber-300/30'
                }`}
                title={hint.description}
              >
                {/* Subtle background pattern for enabled state */}
                {agentToolSettings[hint.category] && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                )}
                
                <span className="relative z-10">
                  {hint.label}
                </span>
                
                {/* Active indicator */}
                {agentToolSettings[hint.category] && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-sm ring-2 ring-blue-500"
                  />
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
    </div>
  )
}

export default ActionableHintChips 