'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'
import { Agent } from './types'

interface ClientQRCodeProps {
  agent: Agent
  organizationSlug: string
  isVisible: boolean
}

export default function ClientQRCode({ agent, organizationSlug, isVisible }: ClientQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [clientChatUrl, setClientChatUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (agent && organizationSlug && isVisible) {
      console.log('🔧 Generating QR code for agent:', agent.id)
      
      // Generate the client chat URL using the business slug
      const baseUrl = window.location.origin
      const chatUrl = `${baseUrl}/client-chat/${organizationSlug}`
      setClientChatUrl(chatUrl)
      
      console.log('📱 Client chat URL:', chatUrl)

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
        console.log('✅ QR code generated successfully')
        setQrCodeUrl(url)
      }).catch(err => {
        console.error('❌ Error generating QR code:', err)
        // Fallback: create a simple placeholder
        setQrCodeUrl('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIxMjgiIHk9IjEyOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iYmxhY2siPk5vIFFSPC90ZXh0Pgo8L3N2Zz4K')
      })
    }
  }, [agent, organizationSlug, isVisible])

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
          title: `Chat with ${agent.name}`,
          text: `Chat directly with our AI assistant for ${agent.name}`,
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
      link.download = `${agent.name}-qr-code.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  if (!isVisible || !agent) return null

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

        {qrCodeUrl && (
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
        )}
      </div>
    </motion.div>
  )
} 