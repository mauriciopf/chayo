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
  Play
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
      id: 'chat',
      title: t('chat.title'),
      description: t('chat.description'),
      icon: MessageSquare,
      features: [
        t('chat.feature1'),
        t('chat.feature2'),
        t('chat.feature3'),
        t('chat.feature4')
      ]
    },
    {
      id: 'business-training',
      title: t('businessTraining.title'),
      description: t('businessTraining.description'),
      icon: Users,
      features: [
        t('businessTraining.feature1'),
        t('businessTraining.feature2'),
        t('businessTraining.feature3'),
        t('businessTraining.feature4')
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
      id: 'appointments',
      title: t('appointments.title'),
      description: t('appointments.description'),
      icon: Calendar,
      features: [
        t('appointments.feature1'),
        t('appointments.feature2'),
        t('appointments.feature3'),
        t('appointments.feature4')
      ]
    },
    {
      id: 'documents',
      title: t('documents.title'),
      description: t('documents.description'),
      icon: FileText,
      features: [
        t('documents.feature1'),
        t('documents.feature2'),
        t('documents.feature3'),
        t('documents.feature4')
      ]
    },
    {
      id: 'payments',
      title: t('payments.title'),
      description: t('payments.description'),
      icon: CreditCard,
      features: [
        t('payments.feature1'),
        t('payments.feature2'),
        t('payments.feature3'),
        t('payments.feature4')
      ]
    },
    {
      id: 'insights',
      title: t('insights.title'),
      description: t('insights.description'),
      icon: BarChart3,
      features: [
        t('insights.feature1'),
        t('insights.feature2'),
        t('insights.feature3'),
        t('insights.feature4')
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
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 rounded-full p-3">
                <IconComponent size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-blue-100 text-sm">{t('subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-100 px-6 py-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                {t('step')} {currentStep + 1} {t('of')} {tutorialSteps.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}% {t('complete')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
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
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 flex-shrink-0">
                    <IconComponent size={48} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      {currentTutorialStep.title}
                    </h2>
                    <p className="text-gray-600 text-lg mb-6 leading-relaxed">
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
                      className="flex items-start space-x-3 bg-gray-50 rounded-lg p-4"
                    >
                      <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Interactive Demo Section */}
                {currentStep === 1 && (
                  <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Play size={20} className="mr-2 text-blue-600" />
                      {t('interactiveDemo')}
                    </h3>
                    <div className="bg-white rounded-lg p-4 border shadow-sm">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          C
                        </div>
                        <div className="bg-blue-100 rounded-lg px-4 py-2 max-w-xs">
                          <p className="text-sm text-blue-900">{t('demoMessage1')}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 justify-end">
                        <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                          <p className="text-sm text-gray-900">{t('demoMessage2')}</p>
                        </div>
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
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
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-blue-600' 
                      : index < currentStep 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentStep === tutorialSteps.length - 1 ? (
              <button
                onClick={onClose}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <span>{t('getStarted')}</span>
                <CheckCircle size={20} />
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
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