'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'
import { AgentChannel } from '@/lib/services/dashboardInitService'

interface ClientQRCodeProps {
  organizationSlug: string
  isOnboardingCompleted?: boolean
  onboardingProgress?: {
    totalQuestions: number
    answeredQuestions: number
    progressPercentage: number
  }
}

export default function ClientQRCode({ organizationSlug, isOnboardingCompleted = false, onboardingProgress }: ClientQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [clientChatUrl, setClientChatUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (organizationSlug) {
      // Generate the client chat URL using the business slug
      const baseUrl = window.location.origin
      const chatUrl = `${baseUrl}/client-chat/${organizationSlug}`
      setClientChatUrl(chatUrl)
      // Generate QR code with better error handling
      QRCode.toDataURL(chatUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937', // gray-800
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      }).then(url => {
        setQrCodeUrl(url)
      }).catch(err => {
        // Fallback: create a simple placeholder
        setQrCodeUrl('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIxMjgiIHk9IjEyOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iYmxhY2siPk5vIFFSPC90ZXh0Pgo8L3N2Zz4K')
      })
    }
  }, [organizationSlug])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(clientChatUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Chat with your business` ,
          text: `Chat directly with our AI assistant` ,
          url: clientChatUrl
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback to copy
      copyToClipboard()
    }
  }

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.download = `business-qr-code.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  if (!organizationSlug) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
    >
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🎯 Client Chat QR Code
        </h3>
        <p className="text-gray-600 mb-6">
          Share this QR code with your customers so they can chat directly with your personalized Chayo assistant
        </p>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Business Setup Progress
            </span>
            <span className="text-sm text-gray-500">
              {onboardingProgress?.progressPercentage || 0}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                isOnboardingCompleted 
                  ? 'bg-green-500' 
                  : (onboardingProgress?.progressPercentage || 0) >= 70 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
              }`}
              style={{ width: `${onboardingProgress?.progressPercentage || 0}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {isOnboardingCompleted ? (
              <span className="text-green-600 font-medium">✅ QR Code is ready to share!</span>
            ) : (
              <span>
                Complete your business setup to unlock the QR code
              </span>
            )}
          </div>
        </div>

        {qrCodeUrl && isOnboardingCompleted ? (
          <div className="flex flex-col items-center space-y-4">
            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg border-2 border-gray-100">
              <img 
                src={qrCodeUrl} 
                alt="Client Chat QR Code"
                className="w-48 h-48"
              />
            </div>

            {/* URL Display */}
            <div className="w-full max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Direct Chat Link:
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={clientChatUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm text-gray-600"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={shareQR}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                📱 Share QR Code
              </button>
              <button
                onClick={downloadQR}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                💾 Download QR
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
              <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Print and display the QR code in your business</li>
                <li>• Share the link via social media or email</li>
                <li>• Customers can scan to chat instantly with Chayo</li>
                <li>• Chayo will represent your business professionally</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-yellow-600 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h4 className="font-medium text-yellow-900 mb-2">QR Code Not Ready Yet</h4>
              <p className="text-sm text-yellow-800">
                Complete your business setup to unlock the QR code. Finish the onboarding process to continue.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
} 