'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface OnboardingCompletionBannerProps {
  isOnboardingCompleted: boolean
}

export default function OnboardingCompletionBanner({
  isOnboardingCompleted
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
      <div className="flex items-center space-x-3">
        {isOnboardingCompleted ? (
          <CheckCircle 
            className="w-5 h-5 flex-shrink-0" 
            style={{ color: 'var(--accent-secondary)' }}
          />
        ) : (
          <AlertCircle 
            className="w-5 h-5 flex-shrink-0" 
            style={{ color: 'var(--accent-primary)' }}
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
    </motion.div>
  )
}