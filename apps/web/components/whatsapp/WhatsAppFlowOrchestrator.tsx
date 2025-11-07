'use client'

import { useState, useEffect } from 'react'
import WhatsAppSetupModal from './WhatsAppSetupModal'
import WhatsAppTemplateSelector from './WhatsAppTemplateSelector'
import { ToolType } from '@/lib/features/tools/shared/services/ToolSystemService'

interface WhatsAppFlowOrchestratorProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  organizationName?: string
  linkToSend: string
  toolName: string
  toolType: ToolType  // NEW: Tool type for template filtering
}

export default function WhatsAppFlowOrchestrator({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  linkToSend,
  toolName,
  toolType
}: WhatsAppFlowOrchestratorProps) {
  const [whatsappConnected, setWhatsappConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)

  // Check WhatsApp connection when modal opens
  useEffect(() => {
    if (isOpen && organizationId) {
      checkWhatsAppStatus()
    }
  }, [isOpen, organizationId])

  const checkWhatsAppStatus = async () => {
    setLoading(true)
    try {
      // Check WhatsApp connection
      const statusResponse = await fetch(`/api/whatsapp/status?organizationId=${organizationId}`)
      const statusData = await statusResponse.json()
      
      const connected = statusData.connected
      setWhatsappConnected(connected)

      if (!connected) {
        // Not connected → Show setup modal
        setShowSetupModal(true)
      } else {
        // Connected → Show template selector (it will handle template logic)
        setShowTemplateSelector(true)
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error)
      // On error, show setup modal
      setWhatsappConnected(false)
      setShowSetupModal(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSetupSuccess = () => {
    setWhatsappConnected(true)
    setShowSetupModal(false)
    // After setup, show template selector
    setShowTemplateSelector(true)
  }
  
  const handleSwitchAccount = () => {
    // User disconnected current WABA, restart the flow
    setWhatsappConnected(false)
    setShowTemplateSelector(false)
    setShowSetupModal(true)
  }

  const handleCloseAll = () => {
    setShowSetupModal(false)
    setShowTemplateSelector(false)
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

      {/* Template Selector - Show if connected (handles all template logic) */}
      {showTemplateSelector && (
        <WhatsAppTemplateSelector
          isOpen={showTemplateSelector}
          onClose={handleCloseAll}
          toolType={toolType}
          toolName={toolName}
          linkToSend={linkToSend}
          organizationId={organizationId}
          organizationName={organizationName}
        />
      )}
    </>
  )
}

