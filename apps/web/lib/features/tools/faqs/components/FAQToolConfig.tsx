'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, MessageCircle, Loader2, ExternalLink, ChevronDown, ChevronRight, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/shared/supabase/client'

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
  const t = useTranslations('agentTools')
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
    <div 
      className="border rounded-lg shadow-sm"
      style={{ 
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)'
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-lg">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircle className="w-6 h-6" />
          <h3 className="text-xl font-semibold">{t('faqs.title')}</h3>
        </div>
        <h4 className="text-lg opacity-90">{faqName || t('faqs.noNameFaq')}</h4>
        <p className="text-sm opacity-75 mt-1">
          {t('faqs.findAnswers')}
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
                    className="w-full p-4 text-left transition-colors flex items-center justify-between"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
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
                    <div className="p-4 border-t" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
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
  const t = useTranslations('agentTools')
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [itemConfig, setItemConfig] = useState({
    question: '',
    answer: ''
  })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const addNewItem = () => {
    const newItem: FAQItem = {
      id: `faq_${Date.now()}`,
      question: t('faqs.defaultQuestion'),
      answer: t('faqs.defaultAnswer'),
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{ 
            backgroundColor: 'var(--accent-secondary)', 
            color: 'white' 
          }}
        >
          <Plus className="w-4 h-4" />
          {t('faqs.addQuestion')}
        </button>
      </div>

      {/* FAQ Items Preview */}
      <div className="border rounded-lg p-4 min-h-[400px]" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        {faqItems.length === 0 ? (
          <div className="flex items-center justify-center h-32" style={{ color: 'var(--text-muted)' }}>
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
                className={`group relative border rounded-lg p-3 cursor-pointer transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                }`}
                style={{ 
                  borderColor: 'var(--border-primary)',
                  backgroundColor: 'var(--bg-tertiary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-secondary)'
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                }}
                onClick={() => startEditing(item)}
              >
                {editingItem === item.id ? (
                  // Inline editing interface
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div 
                      className="text-xs font-medium mb-2"
                      style={{ color: 'var(--accent-secondary)' }}
                    >
                      ⚙️ Editando Q&A #{index + 1}
                    </div>
                    
                    {/* Question */}
                    <div>
                      <label 
                        className="block text-xs font-medium mb-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {t('faqs.questionLabel')} *
                      </label>
                      <input
                        type="text"
                        value={itemConfig.question}
                        onChange={(e) => setItemConfig({ ...itemConfig, question: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1"
                        style={{ 
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border-secondary)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="Ej: ¿Cuáles son sus horarios?"
                      />
                    </div>

                    {/* Answer */}
                    <div>
                      <label 
                        className="block text-xs font-medium mb-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {t('faqs.answerLabel')} *
                      </label>
                      <textarea
                        value={itemConfig.answer}
                        onChange={(e) => setItemConfig({ ...itemConfig, answer: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1"
                        style={{ 
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border-secondary)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="Ej: Estamos abiertos de lunes a viernes de 9:00 AM a 6:00 PM"
                        rows={3}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={saveItemConfig}
                        disabled={!itemConfig.question.trim() || !itemConfig.answer.trim()}
                        className="px-3 py-1 text-white text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'var(--accent-secondary)' }}
                      >
                        {t('common.save')}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal item display
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div 
                      className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity mt-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM7 8a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM7 14a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM17 2a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM17 8a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM17 14a2 2 0 1 0-4 0 2 2 0 0 0 4 0z"></path>
                      </svg>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span 
                          className="text-xs px-2 py-1 rounded font-medium"
                          style={{ 
                            color: 'var(--accent-secondary)',
                            backgroundColor: 'var(--bg-secondary)'
                          }}
                        >
                          Q&A #{index + 1}
                        </span>
                      </div>
                      <div className="mb-2">
                        <div 
                          className="text-sm font-medium mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          ❓ {item.question}
                        </div>
                        <div 
                          className="text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          💬 {item.answer}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItem(item.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 transition-opacity"
                      style={{ color: '#ef4444' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#ef4444'}
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
        <MessageCircle 
          className="w-12 h-12 mx-auto mb-4" 
          style={{ color: 'var(--text-muted)' }} 
        />
        <h4 
          className="text-lg font-medium mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Herramienta de FAQ Deshabilitada
        </h4>
        <p style={{ color: 'var(--text-secondary)' }}>
          Habilita la herramienta de FAQ en la configuración de tu agente para comenzar a crear preguntas frecuentes.
        </p>
      </div>
    )
  }

  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {editingFAQ ? 'Editar FAQ' : 'Crear Nuevo FAQ'}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center px-3 py-1 text-sm border rounded-md transition-colors"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Eye className="w-4 h-4 mr-1" />
              {isPreview ? 'Editor' : 'Vista Previa'}
            </button>
          </div>
        </div>

        {!isPreview ? (
          <div className="space-y-4">
            {/* Helpful instructions */}
            <div 
              className="border rounded-lg p-4"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)', 
                borderColor: 'var(--border-primary)' 
              }}
            >
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>💡 Cómo usar el constructor</h4>
              <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
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

        <div 
          className="flex justify-end gap-3 pt-4 border-t"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <button
            onClick={() => setIsCreating(false)}
            className="px-4 py-2 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSaveFAQ}
            disabled={faqItems.length === 0 || saving}
            className="flex items-center px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent-secondary)' }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              <>
                {t('common.save')} FAQ
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
          <Loader2 
            className="w-8 h-8 animate-spin" 
            style={{ color: 'var(--accent-secondary)' }} 
          />
          <span 
            className="ml-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cargando FAQs...
          </span>
        </div>
      ) : faqs.length === 0 ? (
        <button
          onClick={handleCreateFAQ}
          className="w-full text-center py-8 rounded-lg border-2 border-dashed transition-all group"
          style={{ 
            borderColor: 'var(--border-secondary)',
            backgroundColor: 'var(--bg-secondary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-secondary)'
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-secondary)'
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
          }}
        >
          <MessageCircle 
            className="w-12 h-12 mx-auto mb-4 transition-colors" 
            style={{ color: 'var(--text-muted)' }}
          />
          <h4 
            className="text-lg font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('faqs.emptyState')}
          </h4>
          <p 
            className="mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('faqs.emptyDescription')}
          </p>
          <div 
            className="flex items-center justify-center px-4 py-2 text-white rounded-lg transition-colors mx-auto w-fit"
            style={{ backgroundColor: 'var(--accent-secondary)' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear FAQ
          </div>
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleCreateFAQ}
              className="flex items-center px-4 py-2 text-white rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--accent-secondary)' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo FAQ
            </button>
          </div>
          
          {faqs.map((faq) => (
            <div 
              key={faq.id} 
              className="border rounded-lg p-4"
              style={{ 
                borderColor: 'var(--border-primary)',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 
                    className="text-lg font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {faq.name}
                  </h4>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {faq.faq_items?.length || 0} pregunta{(faq.faq_items?.length || 0) !== 1 ? 's' : ''}
                  </p>
                  <p 
                    className="text-xs mt-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Actualizado: {new Date(faq.updated_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewingFAQ(faq)}
                    className="p-2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Vista Previa"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditFAQ(faq)}
                    className="p-2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Editar FAQ"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFAQ(faq.id)}
                    className="p-2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
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
            <div className="rounded-lg shadow-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
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