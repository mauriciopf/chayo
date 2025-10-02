'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Users, 
  Calendar, 
  FileText, 
  CreditCard, 
  Bot, 
  Settings, 
  BarChart3,
  X,
  CheckCircle,
  Play,
  Sparkles,
  Smartphone,
  QrCode,
  GraduationCap,
  Zap
} from 'lucide-react'

interface TutorialProps {
  isOpen: boolean
  onClose: () => void
}

interface TutorialStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  features: string[]
  demoImage?: string
}

export default function Tutorial({ isOpen, onClose }: TutorialProps) {
  const t = useTranslations('tutorial')
  const [currentStep, setCurrentStep] = useState(0)

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: t('welcome.title'),
      description: t('welcome.description'),
      icon: Bot,
      features: [
        t('welcome.feature1'),
        t('welcome.feature2'),
        t('welcome.feature3'),
        t('welcome.feature4')
      ]
    },
    {
      id: 'onboarding',
      title: t('onboarding.title'),
      description: t('onboarding.description'),
      icon: MessageSquare,
      features: [
        t('onboarding.feature1'),
        t('onboarding.feature2'),
        t('onboarding.feature3'),
        t('onboarding.feature4')
      ]
    },
    {
      id: 'vibeCard',
      title: t('vibeCard.title'),
      description: t('vibeCard.description'),
      icon: Sparkles,
      features: [
        t('vibeCard.feature1'),
        t('vibeCard.feature2'),
        t('vibeCard.feature3'),
        t('vibeCard.feature4')
      ]
    },
    {
      id: 'tools',
      title: t('tools.title'),
      description: t('tools.description'),
      icon: Settings,
      features: [
        t('tools.feature1'),
        t('tools.feature2'),
        t('tools.feature3'),
        t('tools.feature4')
      ]
    },
    {
      id: 'mobileApp',
      title: t('mobileApp.title'),
      description: t('mobileApp.description'),
      icon: Smartphone,
      features: [
        t('mobileApp.feature1'),
        t('mobileApp.feature2'),
        t('mobileApp.feature3'),
        t('mobileApp.feature4')
      ]
    },
    {
      id: 'qrCode',
      title: t('qrCode.title'),
      description: t('qrCode.description'),
      icon: QrCode,
      features: [
        t('qrCode.feature1'),
        t('qrCode.feature2'),
        t('qrCode.feature3'),
        t('qrCode.feature4')
      ]
    },
    {
      id: 'training',
      title: t('training.title'),
      description: t('training.description'),
      icon: GraduationCap,
      features: [
        t('training.feature1'),
        t('training.feature2'),
        t('training.feature3'),
        t('training.feature4')
      ]
    },
    {
      id: 'clientExperience',
      title: t('clientExperience.title'),
      description: t('clientExperience.description'),
      icon: Zap,
      features: [
        t('clientExperience.feature1'),
        t('clientExperience.feature2'),
        t('clientExperience.feature3'),
        t('clientExperience.feature4')
      ]
    },
    {
      id: 'dashboard',
      title: t('dashboard.title'),
      description: t('dashboard.description'),
      icon: BarChart3,
      features: [
        t('dashboard.feature1'),
        t('dashboard.feature2'),
        t('dashboard.feature3'),
        t('dashboard.feature4')
      ]
    }
  ]

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, tutorialSteps.length - 1))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  if (!isOpen) return null

  const currentTutorialStep = tutorialSteps[currentStep]
  const IconComponent = currentTutorialStep.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          {/* Header */}
          <div className="p-6 relative" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              <X size={24} />
            </button>
            <div className="flex items-center space-x-4">
              <div 
                className="rounded-full p-3"
                style={{ backgroundColor: 'var(--accent-secondary)' }}
              >
                <IconComponent size={32} style={{ color: 'white' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('title')}</h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('step')} {currentStep + 1} {t('of')} {tutorialSteps.length}
              </span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}% {t('complete')}
              </span>
            </div>
            <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <motion.div
                className="h-2 rounded-full"
                style={{ backgroundColor: 'var(--accent-secondary)' }}
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start space-x-6">
                  <div 
                    className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <IconComponent size={48} style={{ color: 'var(--accent-secondary)' }} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                      {currentTutorialStep.title}
                    </h2>
                    <p className="text-lg mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {currentTutorialStep.description}
                    </p>
                  </div>
                </div>

                {/* Features List */}
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  {currentTutorialStep.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3 rounded-lg p-4"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <CheckCircle size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-secondary)' }} />
                      <span style={{ color: 'var(--text-primary)' }}>{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Interactive Demo Section */}
                {currentStep === 1 && (
                  <div className="mt-8 rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                      <Play size={20} className="mr-2" style={{ color: 'var(--accent-secondary)' }} />
                      {t('interactiveDemo')}
                    </h3>
                    <div className="rounded-lg p-4 border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
                      <div className="flex items-start space-x-3 mb-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: 'var(--accent-secondary)' }}
                        >
                          C
                        </div>
                        <div className="rounded-lg px-4 py-2 max-w-xs" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{t('demoMessage1')}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 justify-end">
                        <div className="rounded-lg px-4 py-2 max-w-xs" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{t('demoMessage2')}</p>
                        </div>
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: 'var(--bg-hover)' }}
                        >
                          U
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex justify-between items-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={20} />
              <span>{t('previous')}</span>
            </button>

            {/* Step Indicators */}
            <div className="flex space-x-2">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className="w-3 h-3 rounded-full transition-colors"
                  style={{
                    backgroundColor: index === currentStep 
                      ? 'var(--accent-secondary)' 
                      : index < currentStep 
                        ? 'var(--accent-secondary)' 
                        : 'var(--bg-hover)'
                  }}
                />
              ))}
            </div>

            {currentStep === tutorialSteps.length - 1 ? (
              <button
                onClick={onClose}
                className="flex items-center space-x-2 px-6 py-2 text-white rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--accent-secondary)' }}
              >
                <span>{t('getStarted')}</span>
                <CheckCircle size={20} />
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center space-x-2 px-4 py-2 transition-colors"
                style={{ color: 'var(--accent-secondary)' }}
              >
                <span>{t('next')}</span>
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}