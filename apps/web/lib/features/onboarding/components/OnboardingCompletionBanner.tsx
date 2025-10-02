'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CheckCircle, Loader2 } from 'lucide-react'

interface OnboardingCompletionBannerProps {
  isOnboardingCompleted: boolean
  onStartTutorial: () => void
}

export default function OnboardingCompletionBanner({
  isOnboardingCompleted,
  onStartTutorial
}: OnboardingCompletionBannerProps) {
  const tOnboarding = useTranslations('onboarding')

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg p-3 mb-4 border"
      style={{ 
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-secondary)'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isOnboardingCompleted ? (
            <CheckCircle 
              className="w-5 h-5 flex-shrink-0" 
              style={{ color: 'var(--accent-secondary)' }}
            />
          ) : (
            <Loader2 
              className="w-5 h-5 flex-shrink-0 animate-spin" 
              style={{ color: 'var(--accent-secondary)' }}
            />
          )}
          <div>
            <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {isOnboardingCompleted 
                ? tOnboarding('completionBannerTitle')
                : tOnboarding('onboardingInProgressTitle')
              }
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {isOnboardingCompleted 
                ? tOnboarding('completionBannerDescription')
                : tOnboarding('onboardingInProgressDescription')
              }
            </p>
          </div>
        </div>
        <button
          onClick={onStartTutorial}
          className="inline-flex items-center px-4 py-2 text-white text-base rounded-md transition-colors flex-shrink-0 ml-4"
          style={{ backgroundColor: 'var(--accent-secondary)' }}
        >
          {tOnboarding('startTutorialCta')}
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}