'use client'

import React, { useState, useEffect } from 'react'
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
  selectedHint?: TrainingHint | null
  onHintSelect: (hint: TrainingHint | null) => void
  organizationId?: string
  className?: string
  refreshTrigger?: number // Add a trigger to force refresh
}

const TrainingHintChips: React.FC<TrainingHintChipsProps> = ({ 
  selectedHint: controlledSelectedHint, 
  onHintSelect,
  organizationId,
  className = '',
  refreshTrigger = 0
}) => {
  const t = useTranslations('chat')
  const [trainingHints, setTrainingHints] = useState<TrainingHint[]>([])
  const [loading, setLoading] = useState(false)
  const [internalSelectedHint, setInternalSelectedHint] = useState<TrainingHint | null>(null)
  const selectedHint = controlledSelectedHint !== undefined ? controlledSelectedHint : internalSelectedHint

  // Fetch dynamic training hints based on business info fields
  useEffect(() => {
    const fetchTrainingHints = async () => {
      if (!organizationId) {
        setTrainingHints([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/organizations/${organizationId}/business-info-fields`)
        const data = await response.json()

        if (data.success && data.data.fields && data.data.fields.length > 0) {
          // Take the last 8 fields and convert to training hints
          const recentFields = data.data.fields.slice(0, 8)
          const dynamicHints = recentFields.map((field: any) => ({
            id: field.field_name,
            label: formatFieldName(field.field_name),
            icon: '',
            description: `Focus on gathering and improving information about ${formatFieldName(field.field_name).toLowerCase()}`,
            category: 'general'
          }))
          setTrainingHints(dynamicHints)
        } else {
          // No business fields available, show no hints
          setTrainingHints([])
        }
      } catch (error) {
        console.error('Error fetching training hints:', error)
        // Error occurred, show no hints
        setTrainingHints([])
      } finally {
        setLoading(false)
      }
    }

    fetchTrainingHints()
  }, [organizationId, refreshTrigger]) // Add refreshTrigger to dependencies

  // Helper function to format field names (remove underscores, capitalize)
  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }





  const handleHintClick = (hint: TrainingHint) => {
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

  // Don't render anything if no training hints available
  if (trainingHints.length === 0) {
    return null
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Modern Chips Container */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
          {/* Hint Chips */}
          <AnimatePresence>
            {trainingHints.map((hint, index) => (
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
                    ? 'bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-200 ring-offset-2'
                    : 'bg-gray-900/90 backdrop-blur-sm border border-gray-700/60 text-gray-200 hover:bg-gray-800/90 hover:border-purple-400/60 hover:text-white hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105'
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
                    className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-sm ring-2 ring-purple-500"
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

export default TrainingHintChips 