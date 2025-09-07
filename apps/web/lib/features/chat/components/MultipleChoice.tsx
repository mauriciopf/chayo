'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface MultipleChoiceProps {
  options: string[]
  onSelect: (selectedOptions: string | string[]) => void
  disabled?: boolean
  className?: string
  allowMultiple?: boolean
  otherOptionLabel?: string
}

export default function MultipleChoice({ 
  options, 
  onSelect, 
  disabled = false,
  className = '',
  allowMultiple = false,
  otherOptionLabel = 'Other (please specify)'
}: MultipleChoiceProps) {
  // Always show "Other" option when there are multiple choices
  const showOtherOption = options.length > 0
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [otherValue, setOtherValue] = useState('')
    const [showOtherInput, setShowOtherInput] = useState(false)

  console.log('🎲 MultipleChoice component rendered with:', {
    options,
    disabled,
    className,
    allowMultiple,
    showOtherOption,
    selectedOptions,
    otherValue,
    showOtherInput
  })

  const handleOptionClick = (option: string) => {
    if (disabled) return
    
    if (option === otherOptionLabel) {
      setShowOtherInput(true)
      return
    }
    
    if (allowMultiple) {
      const newSelected = selectedOptions.includes(option)
        ? selectedOptions.filter(opt => opt !== option)
        : [...selectedOptions, option]
      
      setSelectedOptions(newSelected)
      onSelect(newSelected)
    } else {
      setSelectedOptions([option])
      onSelect(option)
    }
  }

  const handleOtherSubmit = () => {
    if (otherValue.trim()) {
      const finalValue = otherValue.trim()
      if (allowMultiple) {
        const newSelected = [...selectedOptions, finalValue]
        setSelectedOptions(newSelected)
        onSelect(newSelected)
      } else {
        setSelectedOptions([finalValue])
        onSelect(finalValue)
      }
      setShowOtherInput(false)
      setOtherValue('')
    }
  }

  const handleOtherCancel = () => {
    setShowOtherInput(false)
    setOtherValue('')
  }

  const isOptionSelected = (option: string) => {
    return selectedOptions.includes(option)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-xs text-gray-500 mb-1">
        {allowMultiple ? 'Select one or more:' : 'Choose an option:'}
      </div>
      
      <div className="flex flex-col space-y-1.5">
        {options.map((option, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: disabled ? 1 : 1.01 }}
            whileTap={{ scale: disabled ? 1 : 0.99 }}
            onClick={() => handleOptionClick(option)}
            disabled={disabled}
            className={`w-full text-left px-3 py-2 rounded-lg border transition-all duration-200 text-sm ${
              disabled 
                ? 'cursor-not-allowed' 
                : isOptionSelected(option)
                ? 'shadow-sm'
                : 'cursor-pointer'
            }`}
            style={{
              backgroundColor: disabled 
                ? 'var(--bg-hover)' 
                : isOptionSelected(option)
                ? 'var(--bg-tertiary)'
                : 'var(--bg-secondary)',
              borderColor: disabled
                ? 'var(--border-secondary)'
                : isOptionSelected(option)
                ? 'var(--accent-primary)'
                : 'var(--border-primary)',
              color: disabled
                ? 'var(--text-disabled)'
                : 'var(--text-primary)'
            }}
            onMouseEnter={(e) => {
              if (!disabled && !isOptionSelected(option)) {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                e.currentTarget.style.borderColor = 'var(--accent-primary)'
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && !isOptionSelected(option)) {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                e.currentTarget.style.borderColor = 'var(--border-primary)'
              }
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{option}</span>
              {isOptionSelected(option) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  {allowMultiple ? (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
        
        {showOtherOption && (
          <motion.button
            whileHover={{ scale: disabled ? 1 : 1.01 }}
            whileTap={{ scale: disabled ? 1 : 0.99 }}
            onClick={() => handleOptionClick(otherOptionLabel)}
            disabled={disabled}
            className={`w-full text-left px-3 py-2 rounded-lg border transition-all duration-200 text-sm ${
              disabled 
                ? 'cursor-not-allowed' 
                : showOtherInput
                ? 'shadow-sm'
                : 'cursor-pointer'
            }`}
            style={{
              backgroundColor: disabled 
                ? 'var(--bg-hover)' 
                : showOtherInput
                ? 'var(--bg-tertiary)'
                : 'var(--bg-secondary)',
              borderColor: disabled
                ? 'var(--border-secondary)'
                : showOtherInput
                ? 'var(--accent-primary)'
                : 'var(--border-primary)',
              color: disabled
                ? 'var(--text-disabled)'
                : 'var(--text-primary)'
            }}
            onMouseEnter={(e) => {
              if (!disabled && !showOtherInput) {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                e.currentTarget.style.borderColor = 'var(--accent-primary)'
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && !showOtherInput) {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                e.currentTarget.style.borderColor = 'var(--border-primary)'
              }
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{otherOptionLabel}</span>
              {showOtherInput && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              )}
            </div>
          </motion.button>
        )}
      </div>

      {/* Other option input */}
      {showOtherInput && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="text-xs text-gray-500">
            Please specify:
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={otherValue}
              onChange={(e) => setOtherValue(e.target.value)}
              placeholder="Enter your answer..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleOtherSubmit()}
              autoFocus
            />
            <button
              onClick={handleOtherSubmit}
              disabled={!otherValue.trim()}
              className="px-3 py-2 rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary)'
                }
              }}
            >
              Add
            </button>
            <button
              onClick={handleOtherCancel}
              className="px-3 py-2 rounded-lg transition-colors text-sm"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
              }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Selected options display for multi-select */}
      {allowMultiple && selectedOptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3"
        >
          <div className="text-xs text-gray-500 mb-1">
            Selected ({selectedOptions.length}):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedOptions.map((option, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
              >
                {option}
                <button
                  onClick={() => handleOptionClick(option)}
                  className="ml-1.5 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
} 