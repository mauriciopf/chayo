'use client'

import React, { useEffect } from 'react'

interface CalendlyEmbedProps {
  url: string
  height?: number
  className?: string
}

declare global {
  interface Window {
    Calendly?: any
  }
}

export default function CalendlyEmbed({ 
  url, 
  height = 700, 
  className = '' 
}: CalendlyEmbedProps) {
  
  useEffect(() => {
    // Load Calendly widget script if not already loaded
    const loadCalendlyScript = () => {
      if (window.Calendly) {
        // Calendly is already loaded, initialize widget
        initializeWidget()
        return
      }

      // Create and load Calendly script
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      script.async = true
      script.onload = () => {
        initializeWidget()
      }
      document.head.appendChild(script)

      // Cleanup function to remove script
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      }
    }

    const initializeWidget = () => {
      if (window.Calendly) {
        // Initialize the Calendly inline widget
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: document.getElementById('calendly-inline-widget'),
          prefill: {},
          utm: {}
        })
      }
    }

    loadCalendlyScript()
  }, [url])

  // Extract username from Calendly URL for validation
  const getCalendlyUsername = (calendlyUrl: string) => {
    try {
      const urlObj = new URL(calendlyUrl)
      if (urlObj.hostname === 'calendly.com') {
        const pathParts = urlObj.pathname.split('/').filter(Boolean)
        return pathParts[0] || null
      }
    } catch (error) {
      console.error('Invalid Calendly URL:', error)
    }
    return null
  }

  const username = getCalendlyUsername(url)

  if (!username) {
    return (
      <div className={`${className} p-8 border-2 border-dashed border-red-300 rounded-lg`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Invalid Calendly URL</h3>
          <p className="text-red-700 mb-4">
            Please provide a valid Calendly URL in the format:
          </p>
          <code className="bg-red-50 text-red-800 px-3 py-1 rounded text-sm">
            https://calendly.com/your-username
          </code>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} w-full`}>
      {/* Calendly inline widget container */}
      <div
        id="calendly-inline-widget"
        style={{ minWidth: '320px', height: `${height}px` }}
        className="w-full border border-gray-200 rounded-lg overflow-hidden"
      >
        {/* Loading placeholder */}
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Calendly booking widget...</p>
            <p className="text-sm text-gray-500 mt-2">@{username}</p>
          </div>
        </div>
      </div>
      
      {/* Calendly branding (required by Calendly) */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500">
          Powered by{' '}
          <a 
            href="https://calendly.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            Calendly
          </a>
        </p>
      </div>
    </div>
  )
}