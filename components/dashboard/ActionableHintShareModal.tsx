'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Settings, Upload, FileText, Trash2 } from 'lucide-react'
import { ActionableHint } from './ActionableHintChips'
import Switch from '../ui/Switch'

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

interface BusinessDocument {
  id: string
  filename: string
  file_size: number
  file_type: string
  created_at: string
  processed: boolean
  embedding_status: string
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
    notifications: false,
    faqs: false
  })
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState<BusinessDocument[]>([])
  const [uploading, setUploading] = useState(false)
  const [documentLoading, setDocumentLoading] = useState(false)

  // Load agent tool settings and documents when modal opens
  useEffect(() => {
    if (isOpen && organizationId) {
      loadAgentToolSettings()
      if (hint?.category === 'documents') {
        loadDocuments()
      }
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
        // Notify parent component that settings have changed
        onSettingsChange?.()
      }
    } catch (error) {
      console.error('Error updating agent tool setting:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async () => {
    try {
      setDocumentLoading(true)
      const response = await fetch(`/api/organizations/${organizationId}/agent-documents/upload`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error loading agent documents:', error)
    } finally {
      setDocumentLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/organizations/${organizationId}/agent-documents/upload`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Document ceremony created successfully! Ceremony URL: ${data.ceremony_url}`)
        await loadDocuments() // Refresh the list
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create ceremony')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
      // Reset file input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  // Document functions removed - ceremonies are created automatically on upload

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

              {/* Document Management - Only show for documents category */}
              {hint?.category === 'documents' && isCurrentToolEnabled && (
                <div className="mb-6 space-y-4">
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-medium text-gray-900 mb-4">Manage Documents</h3>
                    
                    {/* Upload Section */}
                    <div className="mb-6">
                      <label className="block">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-1">
                            {uploading ? 'Uploading...' : 'Click to upload PDF document'}
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF files only, max 10MB
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Signing Ceremonies List */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Document Signing Ceremonies</h4>
                      {documentLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Loading ceremonies...</p>
                        </div>
                      ) : documents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm">No signing ceremonies created yet</p>
                          <p className="text-xs">Upload PDF documents to automatically create signing ceremonies</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {documents.map((ceremony) => (
                            <div key={ceremony.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-3 flex-1">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {ceremony.document_name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Status: {ceremony.status} • {new Date(ceremony.created_at).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate">
                                    Ceremony URL: {ceremony.ceremony_url}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  ceremony.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  ceremony.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {ceremony.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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