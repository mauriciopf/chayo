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
  const checkOnboardingCompletion = async () => {
    if (auth.user && auth.currentOrganization) {
      try {
        console.log('🔍 Checking onboarding completion status...')
        const response = await fetch('/api/onboarding-status')
        if (response.ok) {
          const { isCompleted } = await response.json()
          console.log('✅ Onboarding completion status:', isCompleted)
          setIsOnboardingCompleted(isCompleted)
          
          // If completed and unlocked, show QR code immediately
          if (isCompleted && qrCodeUnlocked) {
            setShowQRCode(true)
          }
        }
      } catch (error) {
        console.error('❌ Error checking onboarding completion:', error)
      }
    }
  }

  useEffect(() => {
    checkOnboardingCompletion()
  }, [auth.user, auth.currentOrganization])

  // Update QR code visibility when onboarding completion or unlock status changes
  useEffect(() => {
    if (isOnboardingCompleted && qrCodeUnlocked) {
      console.log('✅ QR Code conditions met - showing QR code')
      setShowQRCode(true)
    }
  }, [isOnboardingCompleted, qrCodeUnlocked])

  const unlockQRCode = async () => {
    console.log('🔓 QR Code unlock triggered')
    setQrCodeUnlocked(true)
    
    // Refresh onboarding status when unlocking
    await checkOnboardingCompletion()
    
    // Force show QR code if onboarding is completed
    if (isOnboardingCompleted) {
      setShowQRCode(true)
    }
  }

  return { showQRCode, setShowQRCode, isOnboardingCompleted, unlockQRCode, refreshOnboardingStatus: checkOnboardingCompletion }
} 