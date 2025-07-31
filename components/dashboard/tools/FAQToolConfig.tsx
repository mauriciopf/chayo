'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, MessageCircle, Loader2, ExternalLink, ChevronDown, ChevronRight, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase/client'

// FAQ Interface
interface FAQ {
  id: string
  name: string
  description: string
  faq_items: FAQItem[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface FAQItem {
  id: string
  question: string
  answer: string
  order: number
}

// FAQ Preview Component (client-facing style)
interface FAQPreviewProps {
  faqName: string
  faqItems: FAQItem[]
}

function FAQPreview({ faqName, faqItems }: FAQPreviewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-lg">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircle className="w-6 h-6" />
          <h3 className="text-xl font-semibold">{t('faqs.title')}</h3>
        </div>
        <h4 className="text-lg opacity-90">{faqName || 'FAQ Sin Nombre'}</h4>
        <p className="text-sm opacity-75 mt-1">
          Encuentra respuestas a las preguntas más comunes
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        {faqItems.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">{t('faqs.noQuestionsAvailable')}</p>
        <p className="text-sm text-gray-400 mt-1">{t('faqs.questionsWillAppear')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const isExpanded = expandedItems.has(item.id)
              return (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
                >
                  {/* Question Header */}
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-purple-600 font-semibold text-sm mt-0.5">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="font-medium text-gray-900 text-sm leading-relaxed">
                        {item.question}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>

                  {/* Answer Content */}
                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-gray-100">
                      <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {item.answer}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        {faqItems.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center">
                        <p className="text-sm text-gray-500 mb-2">
            {t('faqs.didntFind')}
          </p>
          <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            {t('faqs.contactUs')}
          </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Simple FAQ Builder Component
interface SimpleFAQBuilderProps {
  faqItems: FAQItem[]
  onChange: (items: FAQItem[]) => void
}

function SimpleFAQBuilder({ faqItems, onChange }: SimpleFAQBuilderProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [itemConfig, setItemConfig] = useState({
    question: '',
    answer: ''
  })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const addNewItem = () => {
    const newItem: FAQItem = {
      id: `faq_${Date.now()}`,
      question: '¿Nueva pregunta?',
      answer: 'Escribe tu respuesta aquí...',
      order: faqItems.length
    }
    onChange([...faqItems, newItem])
    setEditingItem(newItem.id)
    setItemConfig({
      question: newItem.question,
      answer: newItem.answer
    })
  }

  const removeItem = (itemId: string) => {
    const updatedItems = faqItems.filter(item => item.id !== itemId)
      .map((item, index) => ({ ...item, order: index }))
    onChange(updatedItems)
  }

  const startEditing = (item: FAQItem) => {
    setEditingItem(item.id)
    setItemConfig({
      question: item.question,
      answer: item.answer
    })
  }

  const saveItemConfig = () => {
    if (!editingItem) return

    const updatedItems = faqItems.map(item => 
      item.id === editingItem 
        ? { ...item, question: itemConfig.question, answer: itemConfig.answer }
        : item
    )
    
    onChange(updatedItems)
    setEditingItem(null)
  }

  // Drag and drop handlers for reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', '')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newItems = [...faqItems]
    const draggedItem = newItems[draggedIndex]
    
    // Remove the dragged item
    newItems.splice(draggedIndex, 1)
    
    // Adjust the drop index if we're dragging downward
    const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex
    
    // Insert at new position
    newItems.splice(adjustedDropIndex, 0, draggedItem)

    // Update order numbers
    const reorderedItems = newItems.map((item, index) => ({ ...item, order: index }))
    
    onChange(reorderedItems)
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4">
      {/* Add New Question Button */}
      <div className="flex justify-center">
        <button
          onClick={addNewItem}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('faqs.addQuestion')}
        </button>
      </div>

      {/* FAQ Items Preview */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-[400px]">
        {faqItems.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('faqs.addFrequentQuestions')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {faqItems.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`group relative border border-gray-200 rounded-lg p-3 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                }`}
                onClick={() => startEditing(item)}
              >
                {editingItem === item.id ? (
                  // Inline editing interface
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="text-xs font-medium text-purple-600 mb-2">
                      ⚙️ Editando Q&A #{index + 1}
                    </div>
                    
                    {/* Question */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('faqs.questionLabel')} *
                      </label>
                      <input
                        type="text"
                        value={itemConfig.question}
                        onChange={(e) => setItemConfig({ ...itemConfig, question: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Ej: ¿Cuáles son sus horarios?"
                      />
                    </div>

                    {/* Answer */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('faqs.answerLabel')} *
                      </label>
                      <textarea
                        value={itemConfig.answer}
                        onChange={(e) => setItemConfig({ ...itemConfig, answer: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Ej: Estamos abiertos de lunes a viernes de 9:00 AM a 6:00 PM"
                        rows={3}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={saveItemConfig}
                        disabled={!itemConfig.question.trim() || !itemConfig.answer.trim()}
                        className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal item display
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity mt-1">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM7 8a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM7 14a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM17 2a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM17 8a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM17 14a2 2 0 1 0-4 0 2 2 0 0 0 4 0z"></path>
                      </svg>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded font-medium">
                          Q&A #{index + 1}
                        </span>
                      </div>
                      <div className="mb-2">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          ❓ {item.question}
                        </div>
                        <div className="text-sm text-gray-600">
                          💬 {item.answer}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItem(item.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface FAQToolConfigProps {
  organizationId: string
  isEnabled: boolean
  onSettingsChange?: () => void
}

export default function FAQToolConfig({ organizationId, isEnabled, onSettingsChange }: FAQToolConfigProps) {
  const t = useTranslations('agentTools')
  const [loading, setLoading] = useState(true)
  const [faqs, setFAQs] = useState<FAQ[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [faqName, setFAQName] = useState(t('faqs.defaultName'))
  const [faqItems, setFAQItems] = useState<FAQItem[]>([])
  const [isPreview, setIsPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewingFAQ, setPreviewingFAQ] = useState<FAQ | null>(null)

  // Load FAQs
  useEffect(() => {
    if (isEnabled) {
      loadFAQs()
    }
  }, [isEnabled, organizationId])

  const loadFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs_tool')
        .select('*')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setFAQs(data || [])
    } catch (error) {
      console.error('Error loading FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFAQ = () => {
    setIsCreating(true)
    setEditingFAQ(null)
    setFAQName(t('faqs.defaultName'))
    setFAQItems([])
    setIsPreview(false)
  }

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq)
    setIsCreating(true)
    setFAQName(faq.name)
    setFAQItems(faq.faq_items || [])
    setIsPreview(false)
  }

  const handleSaveFAQ = async () => {
    if (faqItems.length === 0) return

    setSaving(true)
    try {
      if (editingFAQ) {
        // Update existing FAQ
        const { error } = await supabase
          .from('faqs_tool')
          .update({
            name: faqName,
            faq_items: faqItems
          })
          .eq('id', editingFAQ.id)

        if (error) throw error
      } else {
        // Create new FAQ
        const { error } = await supabase
          .from('faqs_tool')
          .insert({
            organization_id: organizationId,
            name: faqName,
            faq_items: faqItems
          })

        if (error) throw error
      }

      await loadFAQs()
      setIsCreating(false)
      setEditingFAQ(null)
    } catch (error) {
      console.error('Error saving FAQ:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFAQ = async (faqId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este FAQ?')) return

    try {
      const { error } = await supabase
        .from('faqs_tool')
        .delete()
        .eq('id', faqId)

      if (error) throw error
      await loadFAQs()
    } catch (error) {
      console.error('Error deleting FAQ:', error)
    }
  }

  if (!isEnabled) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">FAQ Tool Disabled</h4>
        <p className="text-gray-600">
          Enable the FAQ tool in your agent settings to start creating frequently asked questions.
        </p>
      </div>
    )
  }

  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {editingFAQ ? 'Editar FAQ' : 'Crear Nuevo FAQ'}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Eye className="w-4 h-4 mr-1" />
              {isPreview ? 'Editor' : 'Vista Previa'}
            </button>
          </div>
        </div>

        {!isPreview ? (
          <div className="space-y-4">
            {/* Helpful instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Cómo usar el constructor</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>1.</strong> {t('faqs.instructions.step1')}</p>
                <p><strong>2.</strong> {t('faqs.instructions.step2')}</p>
                <p><strong>3.</strong> {t('faqs.instructions.step3')}</p>
                <p><strong>4.</strong> {t('faqs.instructions.step4')}</p>
              </div>
            </div>
            
            <SimpleFAQBuilder
              faqItems={faqItems}
              onChange={setFAQItems}
            />
          </div>
        ) : (
          <FAQPreview faqName={faqName} faqItems={faqItems} />
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => setIsCreating(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSaveFAQ}
                            disabled={faqItems.length === 0 || saving}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                Guardar FAQ
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('faqs.title')}</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Cargando FAQs...</span>
        </div>
      ) : faqs.length === 0 ? (
        <button
          onClick={handleCreateFAQ}
          className="w-full text-center py-8 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all group"
        >
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
          <h4 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-purple-900">{t('faqs.emptyState')}</h4>
          <p className="text-gray-600 mb-4 group-hover:text-purple-700">
            {t('faqs.emptyDescription')}
          </p>
          <div className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg group-hover:bg-purple-700 transition-colors mx-auto w-fit">
            <Plus className="w-4 h-4 mr-2" />
            Crear FAQ
          </div>
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleCreateFAQ}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo FAQ
            </button>
          </div>
          
          {faqs.map((faq) => (
            <div key={faq.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{faq.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {faq.faq_items?.length || 0} pregunta{(faq.faq_items?.length || 0) !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Actualizado: {new Date(faq.updated_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewingFAQ(faq)}
                    className="p-2 text-gray-500 hover:text-purple-600 transition-colors"
                    title="Vista Previa"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditFAQ(faq)}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Editar FAQ"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFAQ(faq.id)}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    title="Eliminar FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewingFAQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Vista Previa del FAQ</h3>
                <button
                  onClick={() => setPreviewingFAQ(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6">
                <FAQPreview 
                  faqName={previewingFAQ.name} 
                  faqItems={previewingFAQ.faq_items || []} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}