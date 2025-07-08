'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Agent {
  id: string
  name: string
  greeting: string
  tone: string
  goals: string[]
  system_prompt: string
  paused: boolean
  created_at: string
}

interface EditAgentModalProps {
  agent: Agent
  onClose: () => void
  onSuccess: () => void
}

export default function EditAgentModal({ agent, onClose, onSuccess }: EditAgentModalProps) {
  const [formData, setFormData] = useState({
    name: agent.name,
    greeting: agent.greeting,
    tone: agent.tone,
    goals: agent.goals.length > 0 ? agent.goals : [''],
    system_prompt: agent.system_prompt
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const toneOptions = [
    { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
    { value: 'helpful', label: 'Helpful', description: 'Supportive and solution-focused' },
    { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and positive' }
  ]

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...formData.goals]
    newGoals[index] = value
    setFormData({ ...formData, goals: newGoals })
  }

  const addGoal = () => {
    if (formData.goals.length < 5) {
      setFormData({ ...formData, goals: [...formData.goals, ''] })
    }
  }

  const removeGoal = (index: number) => {
    if (formData.goals.length > 1) {
      const newGoals = formData.goals.filter((_, i) => i !== index)
      setFormData({ ...formData, goals: newGoals })
    }
  }

  const generateSystemPrompt = () => {
    const filteredGoals = formData.goals.filter(goal => goal.trim() !== '')
    const prompt = `You are ${formData.name}, an AI assistant with a ${formData.tone} tone. 

Your greeting message: "${formData.greeting}"

Your primary goals are:
${filteredGoals.map((goal, index) => `${index + 1}. ${goal}`).join('\n')}

Instructions:
- Always maintain a ${formData.tone} tone in your responses
- Focus on achieving the goals listed above
- Be helpful and provide accurate information
- Keep responses concise but informative
- Ask clarifying questions when needed
- If you cannot help with something, explain why and suggest alternatives`

    setFormData({ ...formData, system_prompt: prompt })
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      const filteredGoals = formData.goals.filter(goal => goal.trim() !== '')
      
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          greeting: formData.greeting,
          tone: formData.tone,
          goals: filteredGoals,
          system_prompt: formData.system_prompt,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update agent')
      }

      const { agent: updatedAgent } = await response.json()
      console.log('Agent updated successfully:', updatedAgent)
      onSuccess()
    } catch (error) {
      console.error('Error updating agent:', error)
      alert('Failed to update agent. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 2) {
      generateSystemPrompt()
    }
    setStep(step + 1)
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim() !== '' && formData.greeting.trim() !== ''
      case 2:
        return formData.goals.some(goal => goal.trim() !== '')
      case 3:
        return formData.system_prompt.trim() !== ''
      default:
        return false
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Agent</h2>
              <p className="text-sm text-gray-500 mt-1">Step {step} of 3 • Editing "{agent.name}"</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNumber <= step 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`h-1 w-16 mx-2 ${
                      stepNumber < step ? 'bg-blue-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex mt-2 text-xs text-gray-600">
              <span className="w-8 text-center">Basic</span>
              <span className="w-16"></span>
              <span className="w-8 text-center">Goals</span>
              <span className="w-16"></span>
              <span className="w-8 text-center">Review</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Customer Support Assistant"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Greeting Message *
                  </label>
                  <textarea
                    value={formData.greeting}
                    onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                    placeholder="e.g., Hi! I'm here to help you with any questions about our services."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone & Personality
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {toneOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, tone: option.value })}
                        className={`p-3 border rounded-lg text-left transition-all duration-200 ${
                          formData.tone === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Goals *
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    What should this agent help users accomplish? Add up to 5 specific goals.
                  </p>
                  
                  <div className="space-y-3">
                    {formData.goals.map((goal, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={goal}
                            onChange={(e) => handleGoalChange(index, e.target.value)}
                            placeholder={`Goal ${index + 1}: e.g., Help customers find the right product`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        {formData.goals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeGoal(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {formData.goals.length < 5 && (
                    <button
                      type="button"
                      onClick={addGoal}
                      className="mt-3 flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add another goal</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Prompt Preview
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    This is how your agent will be configured. You can edit this directly if needed.
                  </p>
                  <textarea
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Agent Summary</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div><strong>Name:</strong> {formData.name}</div>
                    <div><strong>Tone:</strong> {formData.tone}</div>
                    <div><strong>Goals:</strong> {formData.goals.filter(g => g.trim()).length} configured</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              
              {step < 3 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                    canProceed()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                  className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                    canProceed() && !loading
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Updating...' : 'Update Agent'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
