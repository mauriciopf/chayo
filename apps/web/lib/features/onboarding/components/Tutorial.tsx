'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { 
  X,
  MessageSquare,
  Link as LinkIcon,
  Share2,
  Zap
} from 'lucide-react'

interface TutorialProps {
  isOpen: boolean
  onClose: () => void
}

interface TutorialStep {
  id: string
  emoji: string
  title: string
  subtitle: string
  action?: string
}

export default function Tutorial({ isOpen, onClose }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)

  // Reset to first step when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  // Super simple 3-step tutorial
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'chat',
      emoji: '💬',
      title: 'Habla con el Asistente',
      subtitle: 'Configura tu negocio conversando',
      action: 'Cuéntale sobre tus productos y servicios'
    },
    {
      id: 'links',
      emoji: '🔗',
      title: 'Tus herramientas = Enlaces',
      subtitle: 'Cada cosa que creas se convierte en un link',
      action: 'Productos, formularios, pagos, todo'
    },
    {
      id: 'share',
      emoji: '📲',
      title: 'Comparte por WhatsApp',
      subtitle: 'Copia y envía a tus clientes',
      action: 'Así de simple, así de rápido'
    }
  ]

  const nextStep = () => {
    if (currentStep === tutorialSteps.length - 1) {
      onClose()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  if (!isOpen) return null

  const currentTutorialStep = tutorialSteps[currentStep]
  const isLastStep = currentStep === tutorialSteps.length - 1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
          >
            <X size={20} className="text-gray-600" />
          </button>

          {/* Content */}
          <div className="p-8 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="py-8"
              >
                {/* Big Emoji */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: 'spring', 
                    damping: 10, 
                    stiffness: 200,
                    delay: 0.1 
                  }}
                  className="text-8xl mb-6"
                >
                  {currentTutorialStep.emoji}
                </motion.div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  {currentTutorialStep.title}
                </h2>

                {/* Subtitle */}
                <p className="text-xl text-gray-600 mb-4">
                  {currentTutorialStep.subtitle}
                </p>

                {/* Action */}
                {currentTutorialStep.action && (
                  <p className="text-sm text-gray-500 px-6">
                    {currentTutorialStep.action}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <div className="px-8 pb-8">
            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mb-6">
              {tutorialSteps.map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8 }}
                  animate={{ 
                    scale: index === currentStep ? 1.2 : 1,
                    width: index === currentStep ? 32 : 8
                  }}
                  transition={{ duration: 0.3 }}
                  className={`h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-purple-600'
                      : index < currentStep
                        ? 'bg-purple-300'
                        : 'bg-gray-200'
                  }`}
                  style={{ width: index === currentStep ? 32 : 8 }}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                >
                  Atrás
                </button>
              )}
              <button
                onClick={nextStep}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
              >
                {isLastStep ? '¡Comenzar! 🚀' : 'Siguiente'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
