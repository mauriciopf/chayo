'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'

export type ActionableHint = {
  id: string
  label: string
  icon: string
  description: string
  category: 'appointments' | 'documents' | 'payments' | 'notifications' | 'faqs'
}

interface ActionableHintChipsProps {
  selectedHint?: ActionableHint | null
  onHintSelect: (hint: ActionableHint | null) => void
  className?: string
}

const ActionableHintChips: React.FC<ActionableHintChipsProps> = ({ 
  selectedHint: controlledSelectedHint, 
  onHintSelect,
  className = ''
}) => {
  const t = useTranslations('chat')
  const [internalSelectedHint, setInternalSelectedHint] = useState<ActionableHint | null>(null)
  const selectedHint = controlledSelectedHint !== undefined ? controlledSelectedHint : internalSelectedHint

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
      id: 'send_reminder',
      label: '🔔 Send reminders or notifications',
      icon: '🔔',
      description: 'Remind clients of appointments, deadlines, or events.',
      category: 'notifications'
    },
    {
      id: 'answer_faqs',
      label: '❓ Answer common questions (FAQs)',
      icon: '❓',
      description: 'Business hours, location, pricing, policies.',
      category: 'faqs'
    }
  ]





  const handleHintClick = (hint: ActionableHint) => {
    if (controlledSelectedHint === undefined) {
      if (selectedHint?.id === hint.id) {
        setInternalSelectedHint(null)
        onHintSelect(null)
      } else {
        setInternalSelectedHint(hint)
        onHintSelect(hint)
      }
    } else {
      if (selectedHint?.id === hint.id) {
        onHintSelect(null)
      } else {
        onHintSelect(hint)
      }
    }
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
                  selectedHint?.id === hint.id
                    ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-200 ring-offset-2'
                    : 'bg-gray-900/90 backdrop-blur-sm border border-gray-700/60 text-gray-200 hover:bg-gray-800/90 hover:border-blue-400/60 hover:text-white hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105'
                }`}
                title={hint.description}
              >
                {/* Subtle background pattern for selected state */}
                {selectedHint?.id === hint.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                )}
                
                <span className="whitespace-nowrap font-medium relative z-10">
                  {hint.label}
                </span>
                
                {/* Selection indicator */}
                {selectedHint?.id === hint.id && (
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