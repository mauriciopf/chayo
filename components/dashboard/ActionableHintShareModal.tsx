'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Settings, AlertCircle, Info } from 'lucide-react'
import { ActionableHint } from './ActionableHintChips'
import Switch from '../ui/Switch'
import AppointmentToolConfig from './tools/AppointmentToolConfig'
import DocumentToolConfig from './tools/DocumentToolConfig'
import PaymentToolConfig from './tools/PaymentToolConfig'
import IntakeFormsToolConfig from './tools/IntakeFormsToolConfig'
import FAQToolConfig from './tools/FAQToolConfig'

interface ActionableHintShareModalProps {
  isOpen: boolean
  onClose: () => void
  hint: ActionableHint | null
  organizationId: string
  onSettingsChange?: () => void
}

type AgentToolSettings = {
  [key in ActionableHint['category']]: boolean
}

type ToolConstraint = {
  canEnable: boolean
  reason?: string
  missingConfig?: string[]
}



const ActionableHintShareModal: React.FC<ActionableHintShareModalProps> = ({
  isOpen,
  onClose,
  hint,
  organizationId,
  onSettingsChange
}) => {

  const [agentToolSettings, setAgentToolSettings] = useState<AgentToolSettings>({
    appointments: false,
    documents: false,
    payments: false,
    intake_forms: false,
    faqs: false
  })
  const [toolConstraints, setToolConstraints] = useState<{ [key: string]: ToolConstraint }>({})
  const [loading, setLoading] = useState(false)

  // Load agent tool settings and constraints when modal opens
  useEffect(() => {
    if (isOpen && organizationId && hint?.category) {
      loadAgentToolSettings()
      loadToolConstraints(hint.category)
    }
  }, [isOpen, organizationId, hint?.category])

  const loadAgentToolSettings = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/agent-tools`)
      if (response.ok) {
        const settings = await response.json()

        setAgentToolSettings(settings)
      }
    } catch (error) {
      console.error('Error loading agent tool settings:', error)
    }
  }

  const loadToolConstraints = async (toolType: string) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/agent-tools/constraints?toolType=${toolType}`)
      if (response.ok) {
        const constraints = await response.json()

        setToolConstraints(prev => ({
          ...prev,
          [toolType]: constraints
        }))
      }
    } catch (error) {
      console.error('Error loading tool constraints:', error)
    }
  }

  const updateAgentToolSetting = async (toolType: ActionableHint['category'], enabled: boolean) => {
    setLoading(true)
    
    // Optimistic update - immediately update the UI state
    setAgentToolSettings(prev => ({
      ...prev,
      [toolType]: enabled
    }))
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/agent-tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolType,
          enabled
        })
      })

      if (response.ok) {
        // Notify parent component that settings have changed
        onSettingsChange?.()

      } else if (response.status === 422) {
        // Constraint error - show warning but keep the UI state as user intended
        const errorData = await response.json()
        console.log(`⚠️ Warning for ${toolType}:`, errorData)
        // Note: We keep the UI state as the user set it, just show the constraint info
      } else {
        // For other errors, revert the optimistic update
        setAgentToolSettings(prev => ({
          ...prev,
          [toolType]: !enabled
        }))
      }
      
      // Always reload constraints to show current status
      await loadToolConstraints(toolType)
    } catch (error) {
      console.error('Error updating agent tool setting:', error)
      // Revert the optimistic update on network errors
      setAgentToolSettings(prev => ({
        ...prev,
        [toolType]: !enabled
      }))
    } finally {
      setLoading(false)
    }
  }



  const getCategoryContent = (category: ActionableHint['category']) => {
    switch (category) {
      case 'appointments':
        return {
          title: 'Appointment Booking',
          description: 'Allow clients to schedule appointments directly through your chat interface.',
          features: [
            'Real-time availability checking',
            'Automatic calendar integration',
            'Email and SMS confirmations',
            'Rescheduling capabilities'
          ]
        }
      case 'documents':
        return {
          title: 'Document Sharing',
          description: 'Share forms, contracts, and documents seamlessly with your clients.',
          features: [
            'Secure document upload',
            'Digital signature collection',
            'Form auto-fill capabilities',
            'Document status tracking'
          ]
        }
      case 'payments':
        return {
          title: 'Payment Collection',
          description: 'Collect payments and deposits directly through your chat interface.',
          features: [
            'Secure payment processing',
            'Multiple payment methods',
            'Automatic receipt generation',
            'Payment status tracking'
          ]
        }
      case 'intake_forms':
        return {
          title: 'Intake Forms',
          description: 'Create custom forms to collect client information, preferences, and requirements.',
          features: [
            'Custom form builder with multiple field types',
            'Client information collection',
            'Automatic form responses storage',
            'Pre-chat data gathering'
          ]
        }
      case 'faqs':
        return {
          title: 'FAQ Assistant',
          description: 'Provide instant answers to common questions about your business.',
          features: [
            'Intelligent question matching',
            'Business hours information',
            'Pricing and policy details',
            'Location and contact info'
          ]
        }
      default:
        return null
    }
  }

  if (!hint) return null

  const content = getCategoryContent(hint.category)
  if (!content) return null

  const isCurrentToolEnabled = agentToolSettings[hint.category]
  const currentToolConstraints = toolConstraints[hint.category]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{hint.icon}</span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{content.title}</h2>
                  <p className="text-sm text-gray-500">Share this feature with your clients</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Enable/Disable Toggle */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Enable {content.title} Tool</h3>
                      <p className="text-sm text-gray-600">
                        Make this agent tool available in your client chat
                      </p>
                    </div>
                  </div>
                  <Switch
                    enabled={isCurrentToolEnabled}
                    onChange={(enabled) => updateAgentToolSetting(hint.category, enabled)}
                    disabled={loading}
                    size="md"
                  />
                </div>

                {/* Constraint Information */}
                {currentToolConstraints && !currentToolConstraints.canEnable && isCurrentToolEnabled && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">
                          Setup Needed for Full Functionality
                        </h4>
                        <p className="text-sm text-blue-700 mb-2">
                          Tool is enabled, but {currentToolConstraints.reason?.toLowerCase()}
                        </p>
                        {currentToolConstraints.missingConfig && currentToolConstraints.missingConfig.length > 0 && (
                          <div>
                            <p className="text-xs text-blue-600 mb-1 font-medium">To complete setup:</p>
                            <ul className="text-xs text-blue-700 space-y-1">
                              {currentToolConstraints.missingConfig.map((item, index) => (
                                <li key={index} className="flex items-center gap-1">
                                  <span className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0"></span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {currentToolConstraints && currentToolConstraints.canEnable && isCurrentToolEnabled && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-green-700">
                          ✨ This tool is fully configured and ready to use!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">{content.description}</p>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Features included:</h3>
                <ul className="space-y-2">
                  {content.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tool-specific configuration components */}
              {hint?.category === 'appointments' && (
                <AppointmentToolConfig 
                  organizationId={organizationId}
                  isEnabled={isCurrentToolEnabled}
                  onSettingsChange={onSettingsChange}
                />
              )}

              {hint?.category === 'documents' && (
                <DocumentToolConfig 
                  organizationId={organizationId}
                  isEnabled={isCurrentToolEnabled}
                  onSettingsChange={onSettingsChange}
                />
              )}

              {hint?.category === 'payments' && (
                <PaymentToolConfig 
                  organizationId={organizationId}
                  isEnabled={isCurrentToolEnabled}
                  onSettingsChange={onSettingsChange}
                />
              )}

              {hint?.category === 'intake_forms' && (
                <IntakeFormsToolConfig 
                  organizationId={organizationId}
                  isEnabled={isCurrentToolEnabled}
                  onSettingsChange={onSettingsChange}
                />
              )}

              {hint?.category === 'faqs' && (
                <FAQToolConfig 
                  organizationId={organizationId}
                  isEnabled={isCurrentToolEnabled}
                  onSettingsChange={onSettingsChange}
                />
              )}

              {!isCurrentToolEnabled && !['appointments', 'documents', 'payments', 'intake_forms', 'faqs'].includes(hint?.category || '') && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800 text-sm">
                    Enable this agent tool above to make it available to your clients.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ActionableHintShareModal