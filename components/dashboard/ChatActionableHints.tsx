import React, { useState, useRef } from 'react'
import ActionableHintChips, { ActionableHint } from './ActionableHintChips'
import ActionableHintShareModal from './ActionableHintShareModal'

interface ChatActionableHintsProps {
  organizationId: string
}

const ChatActionableHints: React.FC<ChatActionableHintsProps> = ({ organizationId }) => {
  const [selectedHint, setSelectedHint] = useState<ActionableHint | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleHintSelect = (hint: ActionableHint) => {
    setSelectedHint(hint)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedHint(null)
  }

  const handleSettingsChange = () => {
    // Force chips to refresh by updating the key
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 flex-shrink-0">
        <div className="mx-auto max-w-4xl w-full">
          <ActionableHintChips
            key={refreshKey}
            onHintSelect={handleHintSelect}
            organizationId={organizationId}
            className="w-full"
          />
        </div>
      </div>

      <ActionableHintShareModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        hint={selectedHint}
        organizationId={organizationId}
        onSettingsChange={handleSettingsChange}
      />
    </>
  )
}

export default ChatActionableHints 