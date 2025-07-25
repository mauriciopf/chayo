import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface QRCodeLogicProps {
  auth: any
  chat: any
  dashboardInit: any
}

export const useQRCodeLogic = ({ auth, chat, dashboardInit }: QRCodeLogicProps) => {
  const [showQRCode, setShowQRCode] = useState(false)
  const [businessInfoGathered, setBusinessInfoGathered] = useState(0)

  // Check business info gathered count to show QR code
  useEffect(() => {
    const checkBusinessInfo = async () => {
      if (auth.user && auth.currentOrganization && businessInfoGathered >= 5) {
        setShowQRCode(true)
      }
    }
    checkBusinessInfo()
  }, [auth.user, auth.currentOrganization, businessInfoGathered])

  // Monitor chat messages for QR code trigger
  useEffect(() => {
    const recentMessages = chat.messages.slice(-5)
    const hasQRMention = recentMessages.some((msg: any) => 
      msg.role === 'ai' && (
        msg.content.includes('QR code') || 
        msg.content.includes('QR') ||
        msg.content.includes('código QR') ||
        msg.content.includes('client chat system') ||
        msg.content.includes('sistema de chat con los clientes') ||
        msg.content.includes('available in your dashboard') ||
        msg.content.includes('disponible en su panel') ||
        msg.content.includes('Generaré un código QR') ||
        msg.content.includes('generate a QR code') ||
        msg.content.includes('share with your customers') ||
        msg.content.includes('compartir con sus clientes') ||
        msg.content.includes('chat directly with your personalized') ||
        msg.content.includes('chatear directamente con su') ||
        msg.content.includes('configurar su sistema de chat')
      )
    )
    
    if (hasQRMention && auth.currentOrganization) {
      setShowQRCode(true)
    }
  }, [chat.messages, auth.currentOrganization, businessInfoGathered])

  // Check business info gathered count directly
  useEffect(() => {
    const checkBusinessInfoCount = async () => {
      if (auth.user && auth.currentOrganization) {
        try {
          const { data: viewData } = await supabase
            .from('business_constraints_view')
            .select('business_constraints')
            .eq('organization_id', auth.currentOrganization.id)
            .single()

          if (viewData && viewData.business_constraints?.business_info_gathered >= 5) {
            setShowQRCode(true)
            setBusinessInfoGathered(viewData.business_constraints.business_info_gathered)
          }
        } catch (error) {
          console.error('Error checking business info count:', error)
        }
      }
    }

    checkBusinessInfoCount()
  }, [auth.user, auth.currentOrganization])

  // Load business data from dashboard init service
  useEffect(() => {
    if (dashboardInit.initData && !dashboardInit.isLoading) {
      if (dashboardInit.initData.businessInfoFields) {
        setBusinessInfoGathered(dashboardInit.initData.businessInfoFields.business_info_gathered || 0)
      }
    }
  }, [dashboardInit.initData, dashboardInit.isLoading])

  return { showQRCode, setShowQRCode, businessInfoGathered }
} 