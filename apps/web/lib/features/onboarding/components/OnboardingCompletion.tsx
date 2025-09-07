'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CheckCircle, ArrowRight, X } from 'lucide-react'

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
    <>
      {/* Modal Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ backgroundColor: 'var(--bg-primary)' }}
        onClick={handleStartUsing} // Allow clicking outside to close
      >
        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
        >
          {/* Header with Celebration Background */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4"
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-2"
            >
              {t('setupComplete')}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-green-100 text-sm leading-relaxed"
            >
              {t('setupCompleteDescription')}
            </motion.p>
          </div>

          {/* Content */}
          <div className="p-6">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600 text-sm text-center mb-6 leading-relaxed"
            >
              {t('setupCompleteNote')}
            </motion.p>

            {/* Action Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartUsing}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <span>{t('startUsing')}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
} 