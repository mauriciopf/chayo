'use client'

import { useState, useEffect } from 'react'

interface PWAPromptProps {
  onDismiss?: () => void
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
}

export default function PWAPrompt({ onDismiss }: PWAPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false)

  // Add CSS animation for the toast
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideUp {
        from {
          transform: translateX(-50%) translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  useEffect(() => {
    if (isMobileDevice() && !isInStandaloneMode()) {
      setShowPrompt(true)
    }
  }, [])

  const handleInstallClick = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    
    if (isIOS) {
      alert('To install Chayo AI:\n\n1. Tap the Share button (📤) in your browser\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm')
    } else if (isAndroid) {
      alert('To install Chayo AI:\n\n1. Tap the menu button (⋮) in your browser\n2. Tap "Install app" or "Add to Home screen"\n3. Tap "Install" to confirm')
    } else {
      alert('To install Chayo AI, use your browser\'s menu to add this page to your home screen.')
    }
  }

  const handleDismiss = () => {
    // Show helpful reminder when they dismiss the modal
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    
    if (isIOS) {
      // Show a toast-like reminder for iOS users
      const reminder = document.createElement('div')
      reminder.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #374151;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
        animation: slideUp 0.3s ease-out;
      `
      reminder.innerHTML = '💡 Tap Share button (📤) → "Add to Home Screen" to install'
      document.body.appendChild(reminder)
      
      // Remove after 4 seconds
      setTimeout(() => {
        if (reminder.parentNode) {
          reminder.remove()
        }
      }, 4000)
    } else if (isAndroid) {
      const reminder = document.createElement('div')
      reminder.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #374151;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
        animation: slideUp 0.3s ease-out;
      `
      reminder.innerHTML = '💡 Tap Menu (⋮) → "Install app" to add to home screen'
      document.body.appendChild(reminder)
      
      setTimeout(() => {
        if (reminder.parentNode) {
          reminder.remove()
        }
      }, 4000)
    }
    
    setShowPrompt(false)
    onDismiss?.()
  }

  if (!showPrompt) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center">
        <h2 className="text-xl font-bold mb-2">Install Chayo AI</h2>
        <p className="mb-4">
          To use Chayo AI on your phone, simply tap the button below to install the app.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold"
          >
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}

export { isMobileDevice, isInStandaloneMode } 