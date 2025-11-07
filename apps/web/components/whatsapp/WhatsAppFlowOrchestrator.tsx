'use client'

import { useState, useEffect } from 'react'
import WhatsAppSetupModal from './WhatsAppSetupModal'
import WhatsAppSendModal from './WhatsAppSendModal'
import WhatsAppFallbackModal from './WhatsAppFallbackModal'

interface WhatsAppFlowOrchestratorProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  linkToSend: string
  toolName: string
}

export default function WhatsAppFlowOrchestrator({
  isOpen,
  onClose,
  organizationId,
  linkToSend,
  toolName
}: WhatsAppFlowOrchestratorProps) {
  const [whatsappConnected, setWhatsappConnected] = useState<boolean | null>(null)
  const [templateApproved, setTemplateApproved] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showFallbackModal, setShowFallbackModal] = useState(false)

  // Check WhatsApp connection and template status when modal opens
  useEffect(() => {
    if (isOpen && organizationId) {
      checkWhatsAppStatus()
    }
  }, [isOpen, organizationId])

  const checkWhatsAppStatus = async () => {
    setLoading(true)
    try {
      // Step 1: Check WhatsApp connection
      const statusResponse = await fetch(`/api/whatsapp/status?organizationId=${organizationId}`)
      const statusData = await statusResponse.json()
      
      const connected = statusData.connected
      setWhatsappConnected(connected)

      if (!connected) {
        // Not connected → Show setup modal
        setShowSetupModal(true)
      } else {
        // Step 2: Check if template is approved
        const templatesResponse = await fetch(`/api/whatsapp/templates?organizationId=${organizationId}&name=chayo_tool_link`)
        const templatesData = await templatesResponse.json()
        
        const template = templatesData.templates?.find((t: any) => t.name === 'chayo_tool_link')
        const approved = template?.status === 'APPROVED'
        setTemplateApproved(approved)

        if (approved) {
          // Template approved → Use Business API
          setShowSendModal(true)
        } else {
          // Template pending/not approved → Use fallback (wa.me link)
          setShowFallbackModal(true)
        }
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error)
      // On error, default to fallback
      setWhatsappConnected(false)
      setShowFallbackModal(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSetupSuccess = () => {
    setWhatsappConnected(true)
    setShowSetupModal(false)
    // After setup, template will be pending, so show fallback
    setShowFallbackModal(true)
  }
  
  const handleSwitchAccount = () => {
    // User disconnected current WABA, restart the flow
    setWhatsappConnected(false)
    setTemplateApproved(null)
    setShowFallbackModal(false)
    setShowSendModal(false)
    setShowSetupModal(true)
  }

  const handleCloseAll = () => {
    setShowSetupModal(false)
    setShowSendModal(false)
    setShowFallbackModal(false)
    onClose()
  }

  if (!isOpen) return null

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="animate-spin">⏳</div>
            <p className="text-gray-700 dark:text-gray-300">Verificando estado de WhatsApp...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Setup Modal - Show if not connected */}
      {showSetupModal && (
        <WhatsAppSetupModal
          isOpen={showSetupModal}
          onClose={handleCloseAll}
          organizationId={organizationId}
          onSuccess={handleSetupSuccess}
        />
      )}

      {/* Send Modal - Show if connected AND template approved */}
      {showSendModal && (
        <WhatsAppSendModal
          isOpen={showSendModal}
          onClose={handleCloseAll}
          organizationId={organizationId}
          linkToSend={linkToSend}
          toolName={toolName}
        />
      )}

      {/* Fallback Modal - Show if connected BUT template NOT approved */}
      {showFallbackModal && (
        <WhatsAppFallbackModal
          isOpen={showFallbackModal}
          onClose={handleCloseAll}
          linkToSend={linkToSend}
          toolName={toolName}
          templateStatus={templateApproved === null ? 'pending' : 'not_approved'}
          organizationId={organizationId}
          onSwitchAccount={handleSwitchAccount}
        />
      )}
    </>
  )
}

