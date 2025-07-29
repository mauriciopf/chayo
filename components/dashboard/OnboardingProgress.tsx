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
  stage1Completed: boolean
  stage2Completed: boolean
  stage3Completed: boolean
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
      {/* Stage Progress Indicators */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          {/* Stage 1 */}
          <div className="flex items-center space-x-1">
            {progress.stage1Completed ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <Circle className="w-3 h-3 text-gray-300" />
            )}
            <span className={`text-xs ${progress.stage1Completed ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
              Core
            </span>
          </div>

          {/* Stage 2 */}
          <div className="flex items-center space-x-1">
            {progress.stage2Completed ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <Circle className="w-3 h-3 text-gray-300" />
            )}
            <span className={`text-xs ${progress.stage2Completed ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
              Industry
            </span>
          </div>

          {/* Stage 3 */}
          <div className="flex items-center space-x-1">
            {progress.stage3Completed ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <Circle className="w-3 h-3 text-gray-300" />
            )}
            <span className={`text-xs ${progress.stage3Completed ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
              Branding
            </span>
          </div>
        </div>

        <span className="text-xs text-gray-400">
          {progress.progressPercentage}%
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-1 mb-3">
        <motion.div
          className="bg-blue-500 h-1 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress.progressPercentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Current Stage Label */}
      <div className="text-xs text-gray-500 text-center">
        {progress.currentStage === 'stage_1' ? 'Core Setup' : 
         progress.currentStage === 'stage_2' ? 'Industry Questions' :
         progress.currentStage === 'stage_3' ? 'Branding & Tone' : 'Setup Progress'}
      </div>
    </motion.div>
  )
} 