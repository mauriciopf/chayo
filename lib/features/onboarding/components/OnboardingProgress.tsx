'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Circle, Sparkles, Heart, Briefcase } from 'lucide-react'

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
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-6 mb-6 shadow-lg"
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-200/30 to-transparent rounded-full transform translate-x-8 -translate-y-8" />
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="flex items-center space-x-3"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                {t('setupComplete')}
              </h3>
              <p className="text-sm text-green-600 mt-1">
                {t('setupCompleteDescription')}
              </p>
            </div>
          </motion.div>
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

  // Step data with icons and translations
  const steps = [
    {
      number: 1,
      icon: Heart,
      title: t('progressSteps.step1'),
      description: t('stepDescriptions.step1')
    },
    {
      number: 2,
      icon: Briefcase,
      title: t('progressSteps.step2'),
      description: t('stepDescriptions.step2')
    },
    {
      number: 3,
      icon: Sparkles,
      title: t('progressSteps.step3'),
      description: t('stepDescriptions.step3')
    }
  ]

  // Helper function to get step display
  const getStepDisplay = (step: typeof steps[0]) => {
    const status = getStageStatus(step.number)
    const Icon = step.icon
    
    return (
      <motion.div
        key={step.number}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: step.number * 0.1 }}
        className="flex items-center space-x-3 flex-1"
      >
        <div className="flex flex-col items-center">
          <motion.div
            className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
              ${status === 'completed' 
                ? 'bg-green-100 border-green-400 text-green-600' 
                : status === 'active'
                ? 'bg-blue-100 border-blue-400 text-blue-600 animate-pulse'
                : 'bg-gray-50 border-gray-200 text-gray-400'
              }
            `}
            animate={status === 'active' ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 2, repeat: status === 'active' ? Infinity : 0 }}
          >
            {status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </motion.div>
          
          {/* Connector line */}
          {step.number < 3 && (
            <div 
              className={`
                w-px h-8 mt-2 transition-colors duration-500
                ${status === 'completed' ? 'bg-green-300' : 'bg-gray-200'}
              `}
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`
            text-sm font-medium transition-colors duration-300
            ${status === 'completed' 
              ? 'text-green-700' 
              : status === 'active'
              ? 'text-blue-700'
              : 'text-gray-500'
            }
          `}>
            {step.title}
          </h4>
          <p className={`
            text-xs transition-colors duration-300 mt-1
            ${status === 'completed' 
              ? 'text-green-600' 
              : status === 'active'
              ? 'text-blue-600'
              : 'text-gray-400'
            }
          `}>
            {step.description}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50/50 to-purple-50/30 border border-blue-100/60 p-4 mb-3 shadow-sm backdrop-blur-sm"
    >
      {/* Decorative elements - smaller */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full transform translate-x-8 -translate-y-8" />
      <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-purple-100/30 to-transparent rounded-full transform -translate-x-6 translate-y-6" />
      
      <div className="relative">
        {/* Compact Header with inline progress */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-semibold text-gray-800">
              {t('setupInProgress')}
            </h3>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {progress.progressPercentage}%
            </span>
          </div>
          
          {/* Current stage indicator - smaller */}
          <div className="flex items-center space-x-1 px-3 py-1 bg-white/70 rounded-full border border-blue-200/50 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-blue-700">
              {progress.currentStage === 'stage_1' ? t('progressSteps.step1') : 
               progress.currentStage === 'stage_2' ? t('progressSteps.step2') :
               progress.currentStage === 'stage_3' ? t('progressSteps.step3') : t('setupInProgress')}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress.progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400/50 to-purple-400/50 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress.progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        </div>

        {/* Horizontal Steps - more compact */}
        <div className="flex items-center justify-between space-x-2">
          {steps.map((step, index) => {
            const status = getStageStatus(step.number)
            const Icon = step.icon
            
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-1 items-center space-x-2"
              >
                <div className="flex items-center space-x-1">
                  <motion.div
                    className={`
                      flex items-center justify-center w-6 h-6 rounded-full border transition-all duration-300
                      ${status === 'completed' 
                        ? 'bg-green-100 border-green-400 text-green-600' 
                        : status === 'active'
                        ? 'bg-blue-100 border-blue-400 text-blue-600'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                      }
                    `}
                    animate={status === 'active' ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 2, repeat: status === 'active' ? Infinity : 0 }}
                  >
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                  </motion.div>
                  
                  <div className="min-w-0 flex-1">
                    <h4 className={`
                      text-xs font-medium transition-colors duration-300 truncate
                      ${status === 'completed' 
                        ? 'text-green-700' 
                        : status === 'active'
                        ? 'text-blue-700'
                        : 'text-gray-500'
                      }
                    `}>
                      {step.title}
                    </h4>
                  </div>
                </div>
                
                {/* Connector line between steps */}
                {index < steps.length - 1 && (
                  <div 
                    className={`
                      flex-1 h-px transition-colors duration-500 mx-1
                      ${status === 'completed' ? 'bg-green-300' : 'bg-gray-200'}
                    `}
                  />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
} 