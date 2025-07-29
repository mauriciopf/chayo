import { useState, useEffect } from 'react'

interface QRCodeLogicProps {
  auth: any
  chat: any
  dashboardInit: any
}

export const useQRCodeLogic = ({ auth, chat, dashboardInit }: QRCodeLogicProps) => {
  const [showQRCode, setShowQRCode] = useState(false)
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false)
  const [qrCodeUnlocked, setQrCodeUnlocked] = useState(false)

  // Check onboarding completion to show QR code
  useEffect(() => {
    const checkOnboardingCompletion = async () => {
      if (auth.user && auth.currentOrganization) {
        try {
          // Use API endpoint instead of server-side service
          const response = await fetch('/api/onboarding-status')
          if (response.ok) {
            const { isCompleted } = await response.json()
            setIsOnboardingCompleted(isCompleted)
          }
        } catch (error) {
          console.error('Error checking onboarding completion:', error)
        }
      }
    }
    checkOnboardingCompletion()
  }, [auth.user, auth.currentOrganization])

  // Update QR code visibility when onboarding completion or unlock status changes
  useEffect(() => {
    if (isOnboardingCompleted && qrCodeUnlocked) {
      setShowQRCode(true)
    }
  }, [isOnboardingCompleted, qrCodeUnlocked])

  const unlockQRCode = () => {
    setQrCodeUnlocked(true)
    if (isOnboardingCompleted) {
      setShowQRCode(true)
    }
  }

  return { showQRCode, setShowQRCode, isOnboardingCompleted, unlockQRCode }
} 