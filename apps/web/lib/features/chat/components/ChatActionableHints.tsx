import React, { useState, useRef } from 'react'
import ActionableHintChips, { ActionableHint } from './ActionableHintChips'
import ActionableHintShareModal from './ActionableHintShareModal'

type AgentToolSettings = {
  documents: boolean
  payments: boolean
  products: boolean
  intake_forms: boolean
  faqs: boolean
  customer_support: boolean
  reminders: boolean
}

interface ChatActionableHintsProps {
  organizationId: string
}

const ChatActionableHints: React.FC<ChatActionableHintsProps> = ({ organizationId }) => {
  const [selectedHint, setSelectedHint] = useState<ActionableHint | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toolSettings, setToolSettings] = useState<AgentToolSettings | null>(null)

  const handleHintSelect = (hint: ActionableHint, currentSettings: AgentToolSettings) => {
    setSelectedHint(hint)
    setToolSettings(currentSettings)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedHint(null)
    setToolSettings(null)
  }

  const handleSettingsChange = () => {
    // Force chips to refresh by updating the key
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      <div 
        className="py-3 border-t flex-shrink-0"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)',
          overflowX: 'visible', // Allow horizontal overflow for this section
          overflowY: 'hidden'   // Prevent vertical overflow
        }}
      >
        <ActionableHintChips
          key={refreshKey}
          onHintSelect={handleHintSelect}
          organizationId={organizationId}
          className="w-full"
        />
      </div>

      <ActionableHintShareModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        hint={selectedHint}
        organizationId={organizationId}
        onSettingsChange={handleSettingsChange}
        initialToolSettings={toolSettings || undefined}
      />
    </>
  )
}

export default ChatActionableHints 