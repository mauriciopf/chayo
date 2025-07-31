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
      label: '📅 Schedule an appointment',
      icon: '📅',
      description: 'Book a meeting, reservation, or service time slot.',
      category: 'appointments'
    },
    {
      id: 'share_document',
      label: '📝 Share a form or document',
      icon: '📝',
      description: 'Send intake forms, agreements, or information sheets.',
      category: 'documents'
    },
    {
      id: 'collect_payment',
      label: '💳 Collect a payment or deposit',
      icon: '💳',
      description: 'Send a payment link or confirm payment details.',
      category: 'payments'
    },
    {
      id: 'collect_intake_form',
      label: '📋 Collect intake form',
      icon: '📋',
      description: 'Send custom forms to collect client information, preferences, or requirements.',
      category: 'intake_forms'
    },
    {
      id: 'answer_faqs',
      label: '❓ Answer common questions (FAQs)',
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
      {/* Modern Chips Container */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
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
                className={`flex-shrink-0 px-5 py-3 rounded-2xl transition-all duration-300 text-sm font-semibold group relative overflow-hidden ${
                  agentToolSettings[hint.category]
                    ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-200 ring-offset-2 cursor-pointer'
                    : 'bg-gray-300/80 border border-gray-400/50 text-gray-500 cursor-pointer opacity-60 hover:opacity-80 hover:bg-gray-400/80 hover:text-gray-600 hover:border-amber-400/60 hover:ring-1 hover:ring-amber-300/30'
                }`}
                title={hint.description}
              >
                {/* Subtle background pattern for enabled state */}
                {agentToolSettings[hint.category] && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                )}
                
                <span className="whitespace-nowrap font-medium relative z-10">
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

        {/* Modern gradient fade */}
        <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}

export default ActionableHintChips 