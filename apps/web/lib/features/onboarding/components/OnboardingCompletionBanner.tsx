'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CheckCircle } from 'lucide-react'

interface OnboardingCompletionBannerProps {
  isVisible: boolean
  onStartTutorial: () => void
}

export default function OnboardingCompletionBanner({
  isVisible,
  onStartTutorial
}: OnboardingCompletionBannerProps) {
  const tOnboarding = useTranslations('onboarding')

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm text-green-800 font-medium">
              {tOnboarding('completionBannerTitle')}
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              {tOnboarding('completionBannerDescription')}
            </p>
          </div>
        </div>
        <button
          onClick={onStartTutorial}
          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex-shrink-0 ml-4"
        >
          {tOnboarding('startTutorialCta')}
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}