'use client'

import React, { ReactNode, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface WizardStep {
  id: string
  title: string
  description?: string
  content: ReactNode
  isValid?: boolean
  onNext?: () => Promise<boolean> | boolean
  onEnter?: () => Promise<void> | void
}

interface MultiStepWizardProps {
  steps: WizardStep[]
  currentStep: number
  onStepChange: (step: number) => void
  onComplete: () => void
  onCancel?: () => void
  isSubmitting?: boolean
  submitLabel?: string
  cancelLabel?: string
}

export default function MultiStepWizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Completar',
  cancelLabel = 'Cancelar'
}: MultiStepWizardProps) {
  const totalSteps = steps.length
  const currentStepData = steps[currentStep - 1]
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps
  const progress = (currentStep / totalSteps) * 100

  // Call onEnter when step changes
  useEffect(() => {
    if (currentStepData?.onEnter) {
      currentStepData.onEnter()
    }
  }, [currentStep, currentStepData])

  const handleNext = async () => {
    // Run custom validation if provided
    if (currentStepData.onNext) {
      const isValid = await currentStepData.onNext()
      if (!isValid) return
    }

    if (isLastStep) {
      onComplete()
    } else {
      onStepChange(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1)
    }
  }

  const canGoNext = currentStepData.isValid !== false

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <div className="mb-6">
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: 'var(--accent-secondary)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Paso {currentStep} de {totalSteps}
          </p>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {Math.round(progress)}%
          </p>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                <motion.button
                  onClick={() => {
                    // Allow clicking on completed steps to go back
                    if (isCompleted) {
                      onStepChange(stepNumber)
                    }
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    isCompleted ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  style={{
                    backgroundColor: isCompleted || isCurrent 
                      ? 'var(--accent-secondary)' 
                      : 'var(--bg-tertiary)',
                    color: isCompleted || isCurrent ? 'white' : 'var(--text-muted)',
                    border: isCurrent ? '2px solid var(--accent-primary)' : 'none'
                  }}
                  whileHover={isCompleted ? { scale: 1.05 } : {}}
                  whileTap={isCompleted ? { scale: 0.95 } : {}}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm">{stepNumber}</span>
                  )}
                </motion.button>
                <p 
                  className={`text-xs mt-2 text-center font-medium ${
                    isCurrent ? 'opacity-100' : 'opacity-60'
                  }`}
                  style={{ 
                    color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                    maxWidth: '80px'
                  }}
                >
                  {step.title}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div 
                  className="flex-1 h-0.5 mx-2 -mt-10"
                  style={{ 
                    backgroundColor: isCompleted 
                      ? 'var(--accent-secondary)' 
                      : 'var(--bg-tertiary)'
                  }}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step Title and Description */}
      <div className="mb-6">
        <h3 
          className="text-xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {currentStepData.title}
        </h3>
        {currentStepData.description && (
          <p 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            {currentStepData.description}
          </p>
        )}
      </div>

      {/* Step Content with Animation */}
      <div className="flex-1 overflow-auto mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStepData.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-md font-medium transition-colors"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)'
              }}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </button>
          )}
          
          {!isFirstStep && (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)'
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              Atrás
            </button>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={!canGoNext || isSubmitting}
          className="px-6 py-2 rounded-md font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{
            backgroundColor: 'var(--accent-secondary)',
            color: 'white'
          }}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enviando...
            </>
          ) : isLastStep ? (
            <>
              <Check className="w-4 h-4" />
              {submitLabel}
            </>
          ) : (
            <>
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

