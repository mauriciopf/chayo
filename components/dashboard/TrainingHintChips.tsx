'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'

export type TrainingHint = {
  id: string
  label: string
  icon: string
  description: string
  category: 'customer_service' | 'business_operations' | 'marketing' | 'general'
}

interface TrainingHintChipsProps {
  selectedHint: TrainingHint | null
  onHintSelect: (hint: TrainingHint | null) => void
  className?: string
}

const TrainingHintChips: React.FC<TrainingHintChipsProps> = ({ 
  selectedHint, 
  onHintSelect,
  className = ''
}) => {
  const t = useTranslations('chat')

  const trainingHints: TrainingHint[] = [
    {
      id: 'improve_responses',
      label: 'Improve Client Responses',
      icon: '💬',
      description: 'Train AI to better handle customer inquiries and provide more helpful responses',
      category: 'customer_service'
    },
    {
      id: 'update_business_info',
      label: 'Update Business Info',
      icon: '🏢',
      description: 'Gather and update comprehensive business information and details',
      category: 'business_operations'
    },
    {
      id: 'content_filtering',
      label: 'Content Filtering',
      icon: '🛡️',
      description: 'Configure what information should be shared or filtered from customers',
      category: 'general'
    },
    {
      id: 'sales_optimization',
      label: 'Sales Optimization',
      icon: '💰',
      description: 'Improve sales processes and customer conversion strategies',
      category: 'marketing'
    },
    {
      id: 'appointment_handling',
      label: 'Appointment Management',
      icon: '📅',
      description: 'Optimize scheduling and appointment booking processes',
      category: 'customer_service'
    },
    {
      id: 'product_knowledge',
      label: 'Product Knowledge',
      icon: '📋',
      description: 'Enhance AI understanding of your products and services',
      category: 'business_operations'
    },
    {
      id: 'customer_support',
      label: 'Support Workflows',
      icon: '🎧',
      description: 'Improve customer support processes and issue resolution',
      category: 'customer_service'
    },
    {
      id: 'lead_qualification',
      label: 'Lead Qualification',
      icon: '🎯',
      description: 'Better identify and qualify potential customers',
      category: 'marketing'
    }
  ]

  const handleHintClick = (hint: TrainingHint) => {
    if (selectedHint?.id === hint.id) {
      onHintSelect(null) // Deselect if already selected
    } else {
      onHintSelect(hint)
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Scrollable Chips Container */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {/* Hint Chips */}
          <AnimatePresence>
            {trainingHints.map((hint, index) => (
              <motion.button
                key={hint.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleHintClick(hint)}
                className={`flex-shrink-0 flex items-center space-x-3 px-5 py-2.5 border rounded-xl transition-all duration-300 text-sm font-medium group shadow-lg hover:shadow-xl backdrop-blur-md ${
                  selectedHint?.id === hint.id
                    ? 'bg-gradient-to-r from-purple-600/90 to-pink-600/90 border-purple-400/50 text-white shadow-purple-500/25'
                    : 'bg-gray-900/70 border-gray-700/50 text-gray-200 hover:bg-gray-800/80 hover:border-gray-600/60 hover:text-white'
                }`}
                title={hint.description}
              >
                <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                  {hint.icon}
                </span>
                <span className="whitespace-nowrap font-medium">
                  {hint.label}
                </span>
                {selectedHint?.id === hint.id && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-2 h-2 bg-white rounded-full shadow-sm"
                  />
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Enhanced gradient overlay with glassmorphism */}
        <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-gray-50 via-gray-50/50 to-transparent pointer-events-none backdrop-blur-sm" />
      </div>
    </div>
  )
}

export default TrainingHintChips 