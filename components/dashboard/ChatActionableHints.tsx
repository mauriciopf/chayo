import React from 'react'
import ActionableHintChips, { ActionableHint } from './ActionableHintChips'

interface ChatActionableHintsProps {
  onHintSelect: (hint: ActionableHint | null) => void
}

const ChatActionableHints: React.FC<ChatActionableHintsProps> = ({ onHintSelect }) => {
  return (
    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 flex-shrink-0">
      <div className="mx-auto max-w-4xl w-full">
        <ActionableHintChips
          onHintSelect={onHintSelect}
          className="w-full"
        />
      </div>
    </div>
  )
}

export default ChatActionableHints 