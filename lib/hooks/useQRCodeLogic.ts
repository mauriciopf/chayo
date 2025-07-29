import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { IntegratedOnboardingService } from '@/lib/services/integratedOnboardingService'

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
          const onboardingService = new IntegratedOnboardingService()
          const isCompleted = await onboardingService.isOnboardingCompleted(auth.currentOrganization.id)
          setIsOnboardingCompleted(isCompleted)
          
          // Only show QR code if onboarding is completed AND user has clicked "Start Using Chayo"
          if (isCompleted && qrCodeUnlocked) {
            setShowQRCode(true)
          }
        } catch (error) {
          console.error('Error checking onboarding completion:', error)
        }
      }
    }
    checkOnboardingCompletion()
  }, [auth.user, auth.currentOrganization, qrCodeUnlocked])

  // Check onboarding completion periodically
  useEffect(() => {
    const checkOnboardingCompletion = async () => {
      if (auth.user && auth.currentOrganization) {
        try {
          const onboardingService = new IntegratedOnboardingService()
          const isCompleted = await onboardingService.isOnboardingCompleted(auth.currentOrganization.id)
          setIsOnboardingCompleted(isCompleted)
          
          // Only show QR code if onboarding is completed AND user has clicked "Start Using Chayo"
          if (isCompleted && qrCodeUnlocked) {
            setShowQRCode(true)
          }
        } catch (error) {
          console.error('Error checking onboarding completion:', error)
        }
      }
    }

    checkOnboardingCompletion()
  }, [auth.user, auth.currentOrganization, qrCodeUnlocked])

  const unlockQRCode = () => {
    setQrCodeUnlocked(true)
    if (isOnboardingCompleted) {
      setShowQRCode(true)
    }
  }

  return { showQRCode, setShowQRCode, isOnboardingCompleted, unlockQRCode }
} 