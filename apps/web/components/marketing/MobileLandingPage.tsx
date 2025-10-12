'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface MobileLandingPageProps {
  videoUrl?: string
}

export default function MobileLandingPage({ videoUrl }: MobileLandingPageProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Auto-play on mount
  const handleVideoLoad = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log('Autoplay prevented:', error)
        setIsPlaying(false)
      })
    }
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Logo Header */}
      <header className="px-6 py-6 bg-[#111111] border-b border-gray-800">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-white text-4xl font-bold tracking-tight">Chayo</span>
            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
          </div>
          <span className="text-gray-400 text-sm font-light">Tu App Todo-en-Uno</span>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Video Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-sm mb-8"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black">
            {/* Video Player */}
            <div className="aspect-[9/16] relative">
              {videoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                    loop
                    preload="auto"
                    onLoadedData={handleVideoLoad}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    poster="/video-thumbnail.jpg"
                  >
                    <source src={videoUrl} type="video/mp4" />
                    Tu navegador no soporta el video.
                  </video>

                  {/* Play/Pause Overlay */}
                  {!isPlaying && (
                    <div
                      onClick={handlePlayPause}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
                    >
                      <div className="w-20 h-20 rounded-full bg-white bg-opacity-90 flex items-center justify-center shadow-lg">
                        <svg
                          className="w-10 h-10 text-purple-600 ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Tap to Pause when playing */}
                  {isPlaying && (
                    <div
                      onClick={handlePlayPause}
                      className="absolute inset-0 cursor-pointer"
                    />
                  )}
                </>
              ) : (
                // Placeholder when no video
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                  <div className="text-center text-white p-8">
                    <svg className="w-24 h-24 mx-auto mb-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium">Video demo próximamente</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Title & Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mb-8 px-4"
        >
          <h1 className="text-3xl font-bold text-white mb-3">
            Tu Comadre Digital que Nunca Duerme
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Chayo aprende tu negocio y te acompaña 24/7
          </p>
        </motion.div>

        {/* Download Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="w-full max-w-sm space-y-4 px-6"
        >
          {/* iOS Button */}
          <a
            href="https://apps.apple.com/app/chayo"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl px-6 py-4 hover:border-gray-700 transition-all duration-200 active:scale-95">
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5M13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                </svg>
                <div className="text-left">
                  <p className="text-xs text-gray-500">Descargar en</p>
                  <p className="text-lg font-semibold text-white">App Store</p>
                </div>
              </div>
            </div>
          </a>

          {/* Android Button */}
          <a
            href="https://play.google.com/store/apps/details?id=com.chayo"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl px-6 py-4 hover:border-gray-700 transition-all duration-200 active:scale-95">
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <div className="text-left">
                  <p className="text-xs text-gray-500">Disponible en</p>
                  <p className="text-lg font-semibold text-white">Google Play</p>
                </div>
              </div>
            </div>
          </a>

          {/* Desktop Version Link */}
          <a
            href="https://www.chayo.ai"
            className="block w-full"
          >
            <div className="bg-[#111111] rounded-2xl px-6 py-4 border border-gray-800 hover:border-purple-500 transition-all duration-200 active:scale-95">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-400 font-medium">Ver versión de escritorio</p>
              </div>
            </div>
          </a>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 text-center bg-[#111111] border-t border-gray-800">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-gray-500 text-sm"
        >
          © 2025 Chayo AI. Tu asistente digital 24/7.
        </motion.p>
      </footer>
    </div>
  )
}

