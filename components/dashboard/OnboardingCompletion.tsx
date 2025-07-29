'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CheckCircle, ArrowRight } from 'lucide-react'

interface OnboardingCompletionProps {
  isVisible: boolean
  onContinue: () => void
  onNavigateToQR?: () => void
}

export default function OnboardingCompletion({ isVisible, onContinue, onNavigateToQR }: OnboardingCompletionProps) {
  const t = useTranslations('onboarding')

  if (!isVisible) {
    return null
  }

  const handleStartUsing = () => {
    onContinue() // Unlock QR code
    if (onNavigateToQR) {
      onNavigateToQR() // Navigate to QR section
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -10 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {t('setupComplete')}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {t('setupCompleteDescription')}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleStartUsing}
          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex-shrink-0 ml-4"
        >
          {t('startUsing')}
          <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2 pl-8">
        {t('setupCompleteNote')}
      </p>
    </motion.div>
  )
} 