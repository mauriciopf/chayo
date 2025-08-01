import { useState, useEffect } from 'react'
import PWAPrompt, { isMobileDevice } from '../../features/dashboard/components/layout/PWAPrompt'

export function useMobile(scrollChatToBottom: () => void) {
  const [isMobile, setIsMobile] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  useEffect(() => {
    setIsMobile(isMobileDevice())
    const handleResize = () => setIsMobile(isMobileDevice())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Listen for visualViewport resize to adjust chat padding and scroll
  useEffect(() => {
    if (!isMobile) return
    const updatePaddingAndScroll = () => {
      // Use requestAnimationFrame for smooth viewport adjustments
      requestAnimationFrame(() => {
        scrollChatToBottom()
      })
    }
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updatePaddingAndScroll)
    } else {
      window.addEventListener('resize', updatePaddingAndScroll)
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updatePaddingAndScroll)
      } else {
        window.removeEventListener('resize', updatePaddingAndScroll)
      }
    }
  }, [isMobile, scrollChatToBottom])

  return {
    isMobile,
    hasUserInteracted,
    setHasUserInteracted,
  }
} 