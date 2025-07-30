'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CheckCircle, Circle, Clock } from 'lucide-react'

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

  // Helper function to get stage status
  const getStageStatus = (stageNumber: number) => {
    const isCurrentStage = progress.currentStage === `stage_${stageNumber}`
    
    if (stageNumber === 1) {
      return progress.stage1Completed ? 'completed' : isCurrentStage ? 'active' : 'pending'
    } else if (stageNumber === 2) {
      return progress.stage2Completed ? 'completed' : isCurrentStage ? 'active' : 'pending'
    } else if (stageNumber === 3) {
      return progress.stage3Completed ? 'completed' : isCurrentStage ? 'active' : 'pending'
    }
    return 'pending'
  }

  // Helper function to get stage icon and styles
  const getStageDisplay = (stageNumber: number, label: string) => {
    const status = getStageStatus(stageNumber)
    
    let icon, textClass, iconClass
    
    if (status === 'completed') {
      icon = <CheckCircle className="w-3 h-3" />
      textClass = 'text-green-600 font-medium'
      iconClass = 'text-green-500'
    } else if (status === 'active') {
      icon = <Clock className="w-3 h-3" />
      textClass = 'text-blue-600 font-medium'
      iconClass = 'text-blue-500'
    } else {
      icon = <Circle className="w-3 h-3" />
      textClass = 'text-gray-400'
      iconClass = 'text-gray-300'
    }

    return (
      <div className="flex items-center space-x-1">
        <span className={iconClass}>
          {icon}
        </span>
        <span className={`text-xs ${textClass}`}>
          {label}
        </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
      className="mb-4 bg-white border border-gray-100 rounded-lg p-3 shadow-sm"
    >
      {/* Stage Progress Indicators */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          {/* Stage 1 - Core Setup */}
          {getStageDisplay(1, 'Core')}

          {/* Stage 2 - Industry Questions */}
          {getStageDisplay(2, 'Industry')}

          {/* Stage 3 - Branding & Tone */}
          {getStageDisplay(3, 'Branding')}
        </div>

        <div className="text-right">
          <div className="text-xs font-medium text-gray-600">
            {progress.progressPercentage}%
          </div>
          <div className="text-xs text-gray-400">
            {progress.answeredQuestions}/{progress.totalQuestions}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress.progressPercentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Current Stage Label */}
      <div className="text-xs text-gray-500 text-center font-medium">
        {progress.currentStage === 'stage_1' ? 'Core Business Setup' : 
         progress.currentStage === 'stage_2' ? 'Industry-Specific Questions' :
         progress.currentStage === 'stage_3' ? 'Branding & Tone Preferences' : 'Setup In Progress'}
      </div>
    </motion.div>
  )
} 