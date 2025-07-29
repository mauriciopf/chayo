'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CheckCircle, Sparkles, Rocket } from 'lucide-react'

interface OnboardingCompletionProps {
  isVisible: boolean
  onContinue: () => void
}

export default function OnboardingCompletion({ isVisible, onContinue }: OnboardingCompletionProps) {
  const t = useTranslations('onboarding')

  if (!isVisible) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-4 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="flex justify-center mb-4"
      >
        <div className="relative">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-bold text-green-800 mb-2"
      >
        {t('setupComplete')}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-gray-600 mb-4"
      >
        {t('setupCompleteDescription')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <button
          onClick={onContinue}
          className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Rocket className="w-4 h-4 mr-2" />
          {t('startUsing')}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 text-xs text-gray-500"
      >
        {t('setupCompleteNote')}
      </motion.div>
    </motion.div>
  )
} 