'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { 
  Sparkles, 
  Palette, 
  Wand2, 
  CheckCircle, 
  ArrowRight, 
  Clock,
  Zap,
  Heart,
  Star
} from 'lucide-react'

interface VibeCardGenerationModalProps {
  isVisible: boolean
  organizationId: string
  onDismiss: () => void
  currentPhase?: string | null
}

type GenerationStage = 
  | 'initializing'
  | 'analyzing_business'
  | 'crafting_story'
  | 'selecting_colors'
  | 'generating_image'
  | 'finalizing'
  | 'completed'
  | 'error'

interface GenerationProgress {
  stage: GenerationStage
  progress: number
  message: string
  estimatedTimeRemaining?: number
}

const STAGE_MESSAGES = {
  initializing: {
    title: "Starting Your Vibe Card Journey",
    subtitle: "Preparing AI magic for your business...",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500"
  },
  analyzing_business: {
    title: "Understanding Your Business",
    subtitle: "AI is analyzing your unique story and values...",
    icon: Zap,
    color: "from-blue-500 to-cyan-500"
  },
  crafting_story: {
    title: "Crafting Your Story",
    subtitle: "Weaving together your business narrative...",
    icon: Heart,
    color: "from-emerald-500 to-teal-500"
  },
  selecting_colors: {
    title: "Choosing Perfect Colors",
    subtitle: "Selecting colors that match your vibe...",
    icon: Palette,
    color: "from-orange-500 to-red-500"
  },
  generating_image: {
    title: "Creating Your Visual Identity",
    subtitle: "AI is painting your unique vibe card...",
    icon: Wand2,
    color: "from-violet-500 to-purple-500"
  },
  finalizing: {
    title: "Adding Final Touches",
    subtitle: "Perfecting every detail...",
    icon: Star,
    color: "from-yellow-500 to-orange-500"
  },
  completed: {
    title: "Your Vibe Card is Ready!",
    subtitle: "Welcome to the Chayo marketplace",
    icon: CheckCircle,
    color: "from-green-500 to-emerald-500"
  },
  error: {
    title: "Something Went Wrong",
    subtitle: "Don't worry, we can try again or skip for now",
    icon: Clock,
    color: "from-red-500 to-pink-500"
  }
}

export default function VibeCardGenerationModal({ 
  isVisible, 
  organizationId, 
  onDismiss,
  currentPhase
}: VibeCardGenerationModalProps) {
  const t = useTranslations('vibeGeneration')
  const [progress, setProgress] = useState<GenerationProgress>({
    stage: 'initializing',
    progress: 0,
    message: 'Starting vibe card generation...'
  })
  const [startTime] = useState(Date.now())

  // Listen to existing SSE system via currentPhase
  useEffect(() => {
    if (!isVisible || !currentPhase) return

    console.log('🎨 Vibe card modal listening to phase:', currentPhase)
    
    // Map SSE phases to modal stages and progress
    const phaseToStageMap: Record<string, { stage: GenerationStage; progress: number }> = {
      'switchingMode': { stage: 'initializing', progress: 5 },
      'startingVibeCardGeneration': { stage: 'initializing', progress: 10 },
      'analyzingBusiness': { stage: 'analyzing_business', progress: 20 },
      'craftingStory': { stage: 'crafting_story', progress: 40 },
      'selectingColors': { stage: 'selecting_colors', progress: 60 },
      'generatingVibeImage': { stage: 'generating_image', progress: 75 },
      'finalizingVibeCard': { stage: 'finalizing', progress: 95 }
    }

    const stageInfo = phaseToStageMap[currentPhase]
    if (stageInfo) {
      setProgress({
        stage: stageInfo.stage,
        progress: stageInfo.progress,
        message: STAGE_MESSAGES[stageInfo.stage]?.subtitle || 'Processing...'
      })
    }
  }, [currentPhase, isVisible])

  // Detect completion when phases stop updating (vibe card generation finished)
  useEffect(() => {
    if (!isVisible) return

    // If we're in the finalizing phase, show completion after a short delay
    if (currentPhase === 'finalizingVibeCard') {
      const completionTimer = setTimeout(() => {
        setProgress({
          stage: 'completed',
          progress: 100,
          message: 'Vibe card generated successfully!'
        })
        // The actual imageUrl would be available from the vibe card service
        // For now, we'll complete without the image URL and let the onComplete handler handle it
      }, 2000) // 2 seconds after finalizing starts

      return () => clearTimeout(completionTimer)
    }
  }, [currentPhase, isVisible])

  const handleDismiss = () => {
    onDismiss()
  }

  const currentStage = STAGE_MESSAGES[progress.stage]
  const IconComponent = currentStage.icon
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000)

  if (!isVisible) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden backdrop-blur-xl"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {/* Animated Header */}
          <div className={`bg-gradient-to-r ${currentStage.color} px-8 py-10 text-center relative overflow-hidden`}>
            {/* Floating particles animation */}
            <div className="absolute inset-0">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white bg-opacity-30 rounded-full"
                  initial={{ 
                    x: Math.random() * 400,
                    y: Math.random() * 200,
                    opacity: 0 
                  }}
                  animate={{ 
                    x: Math.random() * 400,
                    y: Math.random() * 200,
                    opacity: [0, 1, 0] 
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>

            {/* Main Icon */}
            <motion.div
              key={progress.stage}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6 relative z-10"
            >
              <IconComponent className="w-10 h-10 text-white" />
            </motion.div>
            
            {/* Title */}
            <motion.h2
              key={`${progress.stage}-title`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-white mb-3"
            >
              {currentStage.title}
            </motion.h2>
            
            {/* Subtitle */}
            <motion.p
              key={`${progress.stage}-subtitle`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white text-opacity-90 text-sm leading-relaxed"
            >
              {currentStage.subtitle}
            </motion.p>
          </div>

          {/* Progress Content */}
          <div className="p-8">
            {/* Progress Bar */}
            {progress.stage !== 'completed' && progress.stage !== 'error' && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {progress.message}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(progress.progress)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${currentStage.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Time Information */}
            {progress.stage !== 'completed' && progress.stage !== 'error' && (
              <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
                <span>Elapsed: {elapsedTime}s</span>
                {progress.estimatedTimeRemaining && (
                  <span>~{progress.estimatedTimeRemaining}s remaining</span>
                )}
              </div>
            )}

            {/* Stage-specific content */}
            {progress.stage === 'generating_image' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                  <p className="text-sm text-purple-700">
                    <strong>AI is painting your vibe card...</strong> This usually takes 30-60 seconds for the best quality.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Completed State */}
            {progress.stage === 'completed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-600 text-sm mb-6"
                >
                  Your unique vibe card is ready to attract ideal customers in the marketplace!
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDismiss}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <span>Enter the Marketplace</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            )}

            {/* Error State */}
            {progress.stage === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p className="text-gray-600 text-sm mb-6">
                  {progress.message}
                </p>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200"
                  >
                    Try Again
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDismiss}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200"
                  >
                    Skip for Now
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Loading States - Fun Facts */}
            {!['completed', 'error'].includes(progress.stage) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center"
              >
                <p className="text-xs text-gray-400 italic">
                  💡 Did you know? AI-generated vibe cards help customers find businesses that match their values and aesthetic preferences.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
