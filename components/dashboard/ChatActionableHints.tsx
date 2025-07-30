import React, { useState } from 'react'
import ActionableHintChips, { ActionableHint } from './ActionableHintChips'
import ActionableHintShareModal from './ActionableHintShareModal'

interface ChatActionableHintsProps {
  organizationId: string
}

const ChatActionableHints: React.FC<ChatActionableHintsProps> = ({ organizationId }) => {
  const [selectedHint, setSelectedHint] = useState<ActionableHint | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleHintSelect = (hint: ActionableHint | null) => {
    setSelectedHint(hint)
    if (hint) {
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedHint(null)
  }

  return (
    <>
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 flex-shrink-0">
        <div className="mx-auto max-w-4xl w-full">
          <ActionableHintChips
            onHintSelect={handleHintSelect}
            className="w-full"
          />
        </div>
      </div>

      <ActionableHintShareModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        hint={selectedHint}
        organizationId={organizationId}
      />
    </>
  )
}

export default ChatActionableHints 