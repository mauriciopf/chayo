import React from 'react'
import TrainingHintChips, { TrainingHint } from './TrainingHintChips'

interface ChatTrainingHintsProps {
  organizationId?: string
  onHintSelect: (hint: TrainingHint | null) => void
}

const ChatTrainingHints: React.FC<ChatTrainingHintsProps> = ({ organizationId, onHintSelect }) => {
  return (
    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 flex-shrink-0">
      <div className="mx-auto max-w-4xl w-full">
        <TrainingHintChips
          organizationId={organizationId}
          onHintSelect={onHintSelect}
          className="w-full"
        />
      </div>
    </div>
  )
}

export default ChatTrainingHints 