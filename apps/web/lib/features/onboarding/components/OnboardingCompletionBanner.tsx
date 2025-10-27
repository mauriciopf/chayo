'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CheckCircle, AlertCircle, Play, X, LogIn } from 'lucide-react'

interface OnboardingCompletionBannerProps {
  isOnboardingCompleted: boolean
  isAuthenticated: boolean
}

export default function OnboardingCompletionBanner({
  isOnboardingCompleted,
  isAuthenticated
}: OnboardingCompletionBannerProps) {
  const tOnboarding = useTranslations('onboarding')
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleOpenVideo = () => {
    setShowVideoModal(true)
  }

  const handleCloseVideo = () => {
    setShowVideoModal(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Auto-play video when modal opens
  useEffect(() => {
    if (showVideoModal && videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log('Autoplay prevented:', error)
      })
    }
  }, [showVideoModal])

  // Determine banner state
  const getBannerState = () => {
    if (!isAuthenticated) {
      return {
        icon: <LogIn className="w-5 h-5 flex-shrink-0" style={{ color: '#3b82f6' }} />,
        title: '¡Bienvenido a Chayo!',
        description: 'Mira el video de introducción e inicia sesión para configurar tu negocio y crear tu asistente digital con IA.',
        showVideoButton: true
      }
    }
    
    if (!isOnboardingCompleted) {
      return {
        icon: <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />,
        title: tOnboarding('onboardingInProgressTitle'),
        description: tOnboarding('onboardingInProgressDescription'),
        showVideoButton: true
      }
    }
    
    return {
      icon: <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-secondary)' }} />,
      title: tOnboarding('completionBannerTitle'),
      description: tOnboarding('completionBannerDescription'),
      showVideoButton: true
    }
  }

  const bannerState = getBannerState()

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg p-3 mb-4 border relative"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-secondary)'
        }}
      >
        {/* Video Button - Top Right (only show if authenticated) */}
        {bannerState.showVideoButton && (
          <button
            onClick={handleOpenVideo}
            className="absolute top-3 right-3 flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
            style={{ 
              backgroundColor: 'var(--accent-primary)',
              color: 'white'
            }}
            title="Ver Video de Introducción"
          >
            <Play className="w-4 h-4" />
            <span className="text-xs font-medium">Ver Video de Introducción</span>
          </button>
        )}

        <div className="flex items-center space-x-3 pr-12">
          {bannerState.icon}
          <div>
            <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {bannerState.title}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {bannerState.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
            onClick={handleCloseVideo}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-2xl"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseVideo}
                className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Video Container */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black">
                <div className="aspect-[9/16] md:aspect-video relative">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    playsInline
                    loop
                    preload="metadata"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  >
                    <source src="/demo-video.mp4" type="video/mp4" />
                    Tu navegador no soporta el video.
                  </video>

                  {/* Play/Pause Overlay */}
                  {!isPlaying && (
                    <div
                      onClick={handlePlayVideo}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
                    >
                      <div className="w-20 h-20 rounded-full bg-white bg-opacity-90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <Play className="w-10 h-10 text-purple-600 ml-1" fill="currentColor" />
                      </div>
                    </div>
                  )}

                  {/* Click to Pause when playing */}
                  {isPlaying && (
                    <div
                      onClick={handlePlayVideo}
                      className="absolute inset-0 cursor-pointer"
                    />
                  )}
                </div>
              </div>

              {/* Video Title */}
              <div className="mt-4 text-center">
                <h3 className="text-xl font-semibold text-white">
                  Introducción a Chayo
                </h3>
                <p className="text-gray-400 mt-1">
                  Tu asistente digital 24/7
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}