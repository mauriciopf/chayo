'use client'

/**
 * WhatsAppTemplateSelector
 * 
 * Production-ready component for AI-powered WhatsApp template management.
 * Features:
 * - Check for existing approved templates for specific tool type
 * - Generate new templates with AI
 * - Preview templates before submission
 * - Submit to Meta for approval
 * - Fallback to direct WhatsApp sharing (wa.me)
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ToolType } from '@/lib/features/tools/shared/services/ToolSystemService'
import { WhatsAppTemplate, TemplateComponent } from '@/lib/features/whatsapp/types/template.types'
import { WhatsAppTemplateManager } from '@/lib/features/whatsapp/services/WhatsAppTemplateManager'

interface WhatsAppTemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  toolType: ToolType
  toolName: string
  linkToSend: string
  organizationId: string
  organizationName?: string
}

export default function WhatsAppTemplateSelector({
  isOpen,
  onClose,
  toolType,
  toolName,
  linkToSend,
  organizationId,
  organizationName
}: WhatsAppTemplateSelectorProps) {
  
  const [approvedTemplate, setApprovedTemplate] = useState<WhatsAppTemplate | null>(null)
  const [allTemplates, setAllTemplates] = useState<WhatsAppTemplate[]>([])
  const [generatedComponents, setGeneratedComponents] = useState<TemplateComponent[] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTemplateList, setShowTemplateList] = useState(false)

  // On mount: Check for existing templates for this tool type
  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen, toolType, organizationId])

  const loadTemplates = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load all templates for this tool type
      const templates = await WhatsAppTemplateManager.getTemplates(
        organizationId,
        toolType
      )
      setAllTemplates(templates)
      
      // Find best approved template
      const approved = templates.find(t => t.status === 'APPROVED')
      setApprovedTemplate(approved || null)
      
    } catch (err) {
      console.error('Failed to load templates:', err)
      setError('No se pudo cargar plantillas existentes')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTemplate = async (templateName: string, templateId?: string) => {
    if (!confirm(`¿Eliminar plantilla "${templateName}"?\n\nNota: No podrás crear una plantilla con el mismo nombre durante 30 días.`)) {
      return
    }

    setIsDeleting(templateId || templateName)
    setError(null)

    try {
      await WhatsAppTemplateManager.deleteTemplate(
        organizationId,
        templateName,
        templateId
      )
      
      // Reload templates
      await loadTemplates()
      
      alert('✅ Plantilla eliminada correctamente')
    } catch (err) {
      console.error('Failed to delete template:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar plantilla')
    } finally {
      setIsDeleting(null)
    }
  }

  const generateNewTemplate = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/whatsapp/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          toolType,
          tone: 'friendly',
          language: 'es'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate template')
      }

      const data = await response.json()
      setGeneratedComponents(data.components)
    } catch (err) {
      console.error('Template generation failed:', err)
      setError(err instanceof Error ? err.message : 'Error al generar plantilla')
    } finally {
      setIsGenerating(false)
    }
  }

  const submitTemplateForApproval = async () => {
    if (!generatedComponents) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const templateName = WhatsAppTemplateManager.generateTemplateName(toolType, 'ai')
      
      const response = await fetch('/api/whatsapp/templates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          templateName,
          category: 'UTILITY',
          subCategory: toolType,
          language: 'es',
          components: generatedComponents
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit template')
      }

      alert('✅ Plantilla enviada para aprobación!\n\nMeta revisará tu plantilla en 24-48 horas. Te notificaremos cuando esté aprobada.')
      
      // Reset state and reload templates
      setGeneratedComponents(null)
      await loadTemplates()
      
    } catch (err) {
      console.error('Template submission failed:', err)
      setError(err instanceof Error ? err.message : 'Error al enviar plantilla')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openWhatsAppDirectly = () => {
    const message = encodeURIComponent(`Hola! Aquí está el enlace de ${toolName}:\n\n${linkToSend}`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="text-3xl">💬</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Compartir por WhatsApp
              </h2>
              <p className="text-sm text-gray-500">{toolName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
              <p className="text-gray-600">Verificando plantillas...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Approved Template Exists */}
          {!isLoading && approvedTemplate && !generatedComponents && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✅</span>
                  <h3 className="font-semibold text-green-900">Plantilla Aprobada</h3>
                </div>
                <p className="text-sm text-green-700">
                  Ya tienes una plantilla aprobada para {toolName}
                </p>
              </div>

              <TemplatePreview components={approvedTemplate.components} />

              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // TODO: Implement sending with approved template
                      alert('Próximamente: Enviar con plantilla aprobada')
                    }}
                    className="flex-1 py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📤 Usar esta Plantilla
                  </button>
                  <button
                    onClick={() => setApprovedTemplate(null)}
                    className="px-4 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Crear Nueva
                  </button>
                </div>

                {/* Show all templates link */}
                {allTemplates.length > 1 && (
                  <button
                    onClick={() => setShowTemplateList(true)}
                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Ver todas las plantillas ({allTemplates.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* No Approved Template - Show Info + Manual Action */}
          {!isLoading && !approvedTemplate && !generatedComponents && !showTemplateList && (
            <div className="space-y-4">
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">ℹ️</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      No tienes plantilla para {toolName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Para enviar mensajes de WhatsApp Business, necesitas una plantilla aprobada por Meta.
                      Puedes generar una con IA que sigue las mejores prácticas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🤖</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Genera tu Plantilla con IA
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Nuestra IA creará una plantilla personalizada para compartir {toolName} con tus clientes.
                    </p>
                    <button
                      onClick={generateNewTemplate}
                      disabled={isGenerating}
                      className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Generando plantilla...
                        </span>
                      ) : (
                        '✨ Generar Plantilla con IA'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Show pending/rejected templates if any */}
              {allTemplates.length > 0 && (
                <button
                  onClick={() => setShowTemplateList(true)}
                  className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Ver plantillas existentes ({allTemplates.length})
                </button>
              )}
            </div>
          )}

          {/* Generated Template Preview */}
          {generatedComponents && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📋</span>
                  <h3 className="font-semibold text-blue-900">Plantilla Sugerida</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Revisa la plantilla antes de enviarla a Meta para aprobación
                </p>
              </div>

              <TemplatePreview components={generatedComponents} />

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⏱️ <strong>Tiempo de aprobación:</strong> Meta revisará tu plantilla en 24-48 horas. 
                  Mientras tanto, puedes usar el botón "Abrir WhatsApp" para compartir directamente.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={submitTemplateForApproval}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : '✅ Enviar para Aprobación'}
                </button>
                <button
                  onClick={generateNewTemplate}
                  disabled={isGenerating || isSubmitting}
                  className="px-4 py-3 text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50"
                >
                  🔄 Regenerar
                </button>
              </div>
            </div>
          )}

          {/* Template List View */}
          {showTemplateList && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Plantillas para {toolName}
                </h3>
                <button
                  onClick={() => setShowTemplateList(false)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Volver
                </button>
              </div>

              {allTemplates.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No hay plantillas para este tipo de herramienta
                </p>
              ) : (
                <div className="space-y-2">
                  {allTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 border-2 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {template.status === 'APPROVED' ? '✅' :
                               template.status === 'PENDING' ? '⏳' :
                               template.status === 'REJECTED' ? '❌' : '⏸️'}
                            </span>
                            <span className="font-medium text-gray-900">
                              {template.name}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                              {template.language}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Estado: <span className="font-medium">{template.status}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => deleteTemplate(template.name, template.id)}
                          disabled={isDeleting === template.id || template.status === 'PAUSED'}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Eliminar plantilla"
                        >
                          {isDeleting === template.id ? (
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={generateNewTemplate}
                disabled={isGenerating}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
              >
                {isGenerating ? 'Generando...' : '+ Generar Nueva Plantilla'}
              </button>
            </div>
          )}

          {/* Fallback Option (Always Visible) */}
          {!showTemplateList && (
            <div className="pt-6 border-t">
              <p className="text-sm text-gray-600 mb-3">
                O comparte el enlace directamente:
              </p>
              <button
                onClick={openWhatsAppDirectly}
                className="w-full py-3 px-4 bg-white border-2 border-green-500 text-green-700 font-medium rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Abrir WhatsApp
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  )
}

/**
 * Template Preview Component
 */
function TemplatePreview({ components }: { components: TemplateComponent[] }) {
  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-green-500 px-4 py-2">
        <p className="text-white text-sm font-medium">Vista Previa</p>
      </div>
      
      <div className="p-4 space-y-3 bg-white">
        {components.map((component, index) => {
          if (component.type === 'HEADER' && component.text) {
            return (
              <div key={index} className="font-semibold text-gray-900">
                {component.text}
              </div>
            )
          }
          
          if (component.type === 'BODY' && component.text) {
            return (
              <div key={index} className="text-gray-800 whitespace-pre-wrap">
                {component.text.replace(/\{\{1\}\}/g, '[ENLACE]')}
              </div>
            )
          }
          
          if (component.type === 'FOOTER' && component.text) {
            return (
              <div key={index} className="text-sm text-gray-500">
                {component.text}
              </div>
            )
          }
          
          if (component.type === 'BUTTONS' && component.buttons) {
            return (
              <div key={index} className="flex flex-col gap-2 pt-2">
                {component.buttons.map((button, btnIndex) => (
                  <button
                    key={btnIndex}
                    className="w-full py-2 px-4 bg-white border-2 border-green-500 text-green-700 rounded-lg font-medium text-sm"
                  >
                    {button.text}
                  </button>
                ))}
              </div>
            )
          }
          
          return null
        })}
      </div>
    </div>
  )
}

