'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { DocumentManager } from './DocumentManager'

interface CreateAgentModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateAgentModal({ onClose, onSuccess }: CreateAgentModalProps) {
  const t = useTranslations('createAgentModal')
  const [formData, setFormData] = useState({
    name: '',
    greeting: '',
    tone: 'professional',
    goals: [''],
    system_prompt: ''
  })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<any[]>([])

  const toneOptions = [
    { value: 'professional', label: t('tone.professional.label'), description: t('tone.professional.description') },
    { value: 'friendly', label: t('tone.friendly.label'), description: t('tone.friendly.description') },
    { value: 'casual', label: t('tone.casual.label'), description: t('tone.casual.description') },
    { value: 'helpful', label: t('tone.helpful.label'), description: t('tone.helpful.description') },
    { value: 'enthusiastic', label: t('tone.enthusiastic.label'), description: t('tone.enthusiastic.description') }
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
      
      const response = await fetch('/api/agents', {
        method: 'POST',
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
        throw new Error(errorData.error || 'Failed to create agent')
      }

      const { agent } = await response.json()
      setCreatedAgentId(agent.id)
      setStep(4) // Move to document upload step
      
      // Fetch any existing documents for this agent
      setTimeout(() => {
        fetchDocuments()
      }, 100)
    } catch (error) {
      console.error('Error creating agent:', error)
      // TODO: Show error toast to user
      alert('Failed to create agent. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    onSuccess()
  }

  const fetchDocuments = async () => {
    if (!createdAgentId) return
    
    try {
      const response = await fetch(`/api/documents?agentId=${createdAgentId}`)
      if (response.ok) {
        const { documents } = await response.json()
        setDocuments(documents)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
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
      case 4:
        return true // Document upload is optional
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
          className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Create New Agent
              </h2>
              <p className="text-sm text-gray-500 mt-1">Step {step} of 4</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-purple-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-b border-gray-200/50">
            <div className="flex items-center">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    stepNumber <= step 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 4 && (
                    <div className={`h-1 w-12 mx-2 rounded-full transition-all duration-200 ${
                      stepNumber < step ? 'bg-orange-400' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex mt-2 text-xs text-gray-600">
              <span className="w-8 text-center">{t('steps.basic')}</span>
              <span className="w-12"></span>
              <span className="w-8 text-center">{t('steps.goals')}</span>
              <span className="w-12"></span>
              <span className="w-8 text-center">{t('steps.review')}</span>
              <span className="w-12"></span>
              <span className="w-8 text-center">{t('steps.docs')}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('agentName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('agentNamePlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('greetingMessage')} *
                  </label>
                  <textarea
                    value={formData.greeting}
                    onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                    placeholder={t('greetingPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('tonePersonality')}
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {toneOptions.map((option) => (
                      <label key={option.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="tone"
                          value={option.value}
                          checked={formData.tone === option.value}
                          onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                          className="text-orange-400 focus:ring-orange-400"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('agentGoals')} *
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('agentGoalsDescription')}
                  </p>
                  
                  <div className="space-y-3">
                    {formData.goals.map((goal, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={goal}
                          onChange={(e) => handleGoalChange(index, e.target.value)}
                          placeholder={`${t('goalPlaceholder')}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        />
                        {formData.goals.length > 1 && (
                          <button
                            onClick={() => removeGoal(index)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {formData.goals.length < 5 && (
                    <button
                      onClick={addGoal}
                      className="mt-3 text-sm text-orange-400 hover:text-orange-600 flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>{t('addAnotherGoal')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Prompt
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    This defines how your agent behaves. You can customize it or use the generated version.
                  </p>
                  <textarea
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {step === 4 && createdAgentId && (
              <div className="space-y-6">
                <div className="text-center pb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('agentCreated')}</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Your agent is ready to use. You can optionally add business documents to enhance its knowledge base.
                  </p>
                </div>

                <DocumentManager
                  agentId={createdAgentId}
                  documents={documents}
                  onDocumentUploaded={fetchDocuments}
                  onDocumentDeleted={fetchDocuments}
                />

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        <strong>{t('optional')}:</strong> {t('optionalUploadDocs')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200/50">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={step === 1 ? onClose : () => setStep(step - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl transition-all duration-200"
            >
              {step === 1 ? t('cancel') : t('back')}
            </motion.button>

            <div className="flex space-x-3">
              {step === 4 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFinish}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl transition-all duration-200"
                >
                  Skip Documents
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={step === 3 ? handleSubmit : step === 4 ? handleFinish : nextStep}
                disabled={(!canProceed() || loading) && step !== 4}
                className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{t('creating')}</span>
                  </span>
                ) : step === 3 ? t('createAgent') : step === 4 ? t('finish') : t('next')}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
