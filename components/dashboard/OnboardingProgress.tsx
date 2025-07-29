'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CheckCircle, Circle } from 'lucide-react'

export interface OnboardingProgressData {
  totalQuestions: number
  answeredQuestions: number
  currentStage: string
  progressPercentage: number
  isCompleted: boolean
  currentQuestion?: string
}

interface OnboardingProgressProps {
  progress: OnboardingProgressData
  isVisible: boolean
}

export default function OnboardingProgress({ progress, isVisible }: OnboardingProgressProps) {
  const t = useTranslations('onboarding')

  if (!isVisible) {
    return null
  }

  // Show completion indicator if setup is complete
  if (progress.isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center p-3 mb-4"
      >
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {t('setupComplete')}
          </span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
      className="mb-4"
    >
      {/* Minimal Progress Bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium">
          {progress.currentStage === 'stage_1' ? 'Core Setup' : 
           progress.currentStage === 'stage_2' ? 'Industry Questions' :
           progress.currentStage === 'stage_3' ? 'Branding & Tone' : 'Setup Progress'}
        </span>
        <span className="text-xs text-gray-400">
          {progress.progressPercentage}%
        </span>
      </div>
      
      <div className="w-full bg-gray-100 rounded-full h-1 mb-3">
        <motion.div
          className="bg-blue-500 h-1 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress.progressPercentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Removed Current Question section - question is already shown in chat */}
    </motion.div>
  )
} 