'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Settings, AlertCircle, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ActionableHint } from './ActionableHintChips'
import Switch from '../../../shared/ui/Switch'
import AppointmentToolConfig from '../../tools/appointments/components/AppointmentToolConfig'
import DocumentToolConfig from '../../tools/documents/components/DocumentToolConfig'
import PaymentToolConfig from '../../tools/payments/components/PaymentToolConfig'
import IntakeFormsToolConfig from '../../tools/intake-forms/components/IntakeFormsToolConfig'
import FAQToolConfig from '../../tools/faqs/components/FAQToolConfig'
import { VibeCardConfig } from '../../tools/vibe-card/components/VibeCardConfig'
import ProductsToolConfig from '../../tools/products/components/ProductsToolConfig'
import CustomerSupportTool from '../../tools/customer-support/components/CustomerSupportTool'

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
  const t = useTranslations('agentTools')

  const [agentToolSettings, setAgentToolSettings] = useState<AgentToolSettings>({
    appointments: false,
    documents: false,
    payments: false,
    products: false,
    intake_forms: false,
    faqs: false,
    'vibe-card': false,
    customer_support: false
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
          title: t('modal.appointments.title'),
          description: t('modal.appointments.description'),
          features: [
            t('modal.appointments.features.0'),
            t('modal.appointments.features.1'),
            t('modal.appointments.features.2'),
            t('modal.appointments.features.3')
          ]
        }
      case 'documents':
        return {
          title: t('modal.documents.title'),
          description: t('modal.documents.description'),
          features: [
            t('modal.documents.features.0'),
            t('modal.documents.features.1'),
            t('modal.documents.features.2'),
            t('modal.documents.features.3')
          ]
        }
      case 'payments':
        return {
          title: t('modal.payments.title'),
          description: t('modal.payments.description'),
          features: [
            t('modal.payments.features.0'),
            t('modal.payments.features.1'),
            t('modal.payments.features.2'),
            t('modal.payments.features.3')
          ]
        }
      case 'intake_forms':
        return {
          title: t('modal.intakeForms.title'),
          description: t('modal.intakeForms.description'),
          features: [
            t('modal.intakeForms.features.0'),
            t('modal.intakeForms.features.1'),
            t('modal.intakeForms.features.2'),
            t('modal.intakeForms.features.3')
          ]
        }
      case 'faqs':
        return {
          title: t('modal.faqs.title'),
          description: t('modal.faqs.description'),
          features: [
            t('modal.faqs.features.0'),
            t('modal.faqs.features.1'),
            t('modal.faqs.features.2'),
            t('modal.faqs.features.3')
          ]
        }
      case 'vibe-card':
        return {
          title: t('modal.vibeCard.title'),
          description: t('modal.vibeCard.description'),
          features: [
            t('modal.vibeCard.features.0'),
            t('modal.vibeCard.features.1'),
            t('modal.vibeCard.features.2'),
            t('modal.vibeCard.features.3')
          ]
        }
      case 'products':
        return {
          title: t('modal.products.title'),
          description: t('modal.products.description'),
          features: [
            t('modal.products.features.0'),
            t('modal.products.features.1'),
            t('modal.products.features.2'),
            t('modal.products.features.3')
          ]
        }
      case 'customer_support':
        return {
          title: 'Customer Support',
          description: 'Enable real-time customer support chat for your mobile app users',
          features: [
            'Real-time messaging with customers',
            'Conversation management and history',
            'Multiple agent support',
            'Read receipts and status tracking'
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
            className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-6 border-b flex-shrink-0"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{hint.icon}</span>
                <div>
                  <h2 
                    className="text-xl font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {content.title}
                  </h2>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t('modal.shareFeature')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors"
                style={{ 
                  color: 'var(--text-secondary)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto min-h-0">
              {/* Enable/Disable Toggle */}
              <div 
                className="mb-6 p-4 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                    <div>
                      <h3 
                        className="font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {t('modal.enableTool', { title: content.title })}
                      </h3>
                      <p 
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {t('modal.makeToolAvailable')}
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
                  <div 
                    className="mt-4 p-3 rounded-lg border"
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                      <div className="flex-1">
                        <h4 
                          className="text-sm font-medium mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {t('modal.setupNeeded')}
                        </h4>
                        <p 
                          className="text-sm mb-2"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {t('modal.toolEnabled', { reason: currentToolConstraints.reason?.toLowerCase() || '' })}
                        </p>
                        {currentToolConstraints.missingConfig && currentToolConstraints.missingConfig.length > 0 && (
                          <div>
                            <p 
                              className="text-xs mb-1 font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {t('modal.toCompleteSetup')}
                            </p>
                            <ul 
                              className="text-xs space-y-1"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {currentToolConstraints.missingConfig.map((item, index) => (
                                <li 
                                  key={index} 
                                  className="flex items-center gap-1"
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  <span 
                                    className="w-1 h-1 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: 'var(--accent-primary)' }}
                                  ></span>
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
                  <div 
                    className="mt-4 p-3 rounded-lg border"
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 flex-shrink-0" style={{ color: '#22c55e' }} />
                      <div className="flex-1">
                        <p 
                          className="text-sm"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {t('modal.toolConfigured')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <p 
                  className="leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {content.description}
                </p>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 
                  className="font-medium mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {t('modal.featuresIncluded')}
                </h3>
                <ul className="space-y-2">
                  {content.features.map((feature, index) => (
                    <li 
                      key={index} 
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
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

              {hint?.category === 'vibe-card' && (
                <VibeCardConfig 
                  organizationId={organizationId}
                  isEnabled={isCurrentToolEnabled}
                  onSettingsChange={onSettingsChange}
                />
              )}

              {hint?.category === 'products' && (
                <ProductsToolConfig 
                  organizationId={organizationId}
                  isEnabled={isCurrentToolEnabled}
                  onSettingsChange={onSettingsChange}
                />
              )}

              {hint?.category === 'customer_support' && (
                <CustomerSupportTool 
                  organizationId={organizationId}
                  isEnabled={isCurrentToolEnabled}
                  onSettingsChange={onSettingsChange || (() => {})}
                />
              )}

              {!isCurrentToolEnabled && !['appointments', 'documents', 'payments', 'products', 'intake_forms', 'faqs', 'vibe-card', 'customer_support'].includes(hint?.category || '') && (
                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)'
                  }}
                >
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
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