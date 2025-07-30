'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Settings } from 'lucide-react'
import { ActionableHint } from './ActionableHintChips'
import Switch from '../ui/Switch'

interface ActionableHintShareModalProps {
  isOpen: boolean
  onClose: () => void
  hint: ActionableHint | null
  organizationId: string
}

type AgentToolSettings = {
  [key in ActionableHint['category']]: boolean
}

const ActionableHintShareModal: React.FC<ActionableHintShareModalProps> = ({
  isOpen,
  onClose,
  hint,
  organizationId
}) => {

  const [agentToolSettings, setAgentToolSettings] = useState<AgentToolSettings>({
    appointments: false,
    documents: false,
    payments: false,
    notifications: false,
    faqs: false
  })
  const [loading, setLoading] = useState(false)

  // Load agent tool settings when modal opens
  useEffect(() => {
    if (isOpen && organizationId) {
      loadAgentToolSettings()
    }
  }, [isOpen, organizationId])

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

  const updateAgentToolSetting = async (toolType: ActionableHint['category'], enabled: boolean) => {
    setLoading(true)
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
        setAgentToolSettings(prev => ({
          ...prev,
          [toolType]: enabled
        }))
      }
    } catch (error) {
      console.error('Error updating agent tool setting:', error)
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
      case 'notifications':
        return {
          title: 'Smart Notifications',
          description: 'Send automated reminders and notifications to your clients.',
          features: [
            'Appointment reminders',
            'Payment due notifications',
            'Custom message scheduling',
            'Multi-channel delivery'
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

              {!isCurrentToolEnabled && (
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