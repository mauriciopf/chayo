'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, MessageCircle, Loader2, ExternalLink } from 'lucide-react'
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
          Agregar Pregunta
        </button>
      </div>

      {/* FAQ Items Preview */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-[400px]">
        {faqItems.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Agrega preguntas frecuentes para tus clientes</p>
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
                        Pregunta *
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
                        Respuesta *
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
  const [loading, setLoading] = useState(true)
  const [faqs, setFAQs] = useState<FAQ[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [faqName, setFAQName] = useState('')
  const [faqItems, setFAQItems] = useState<FAQItem[]>([])
  const [isPreview, setIsPreview] = useState(false)
  const [saving, setSaving] = useState(false)

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
    setFAQName('')
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
    if (!faqName.trim()) return

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
            {/* FAQ Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del FAQ *
              </label>
              <input
                type="text"
                value={faqName}
                onChange={(e) => setFAQName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: Preguntas Frecuentes Generales"
              />
            </div>

            {/* Helpful instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Cómo usar el constructor</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>1.</strong> Haz clic en "Agregar Pregunta" para crear Q&A</p>
                <p><strong>2.</strong> Arrastra las preguntas para reordenarlas</p>
                <p><strong>3.</strong> Haz clic en cualquier pregunta para editarla</p>
                <p><strong>4.</strong> Usa "Vista Previa" para ver cómo se verá el FAQ</p>
              </div>
            </div>
            
            <SimpleFAQBuilder
              faqItems={faqItems}
              onChange={setFAQItems}
            />
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">{faqName || 'FAQ Sin Nombre'}</h4>
            {faqItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay preguntas creadas aún</p>
            ) : (
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="font-medium text-gray-900 mb-2">
                      {index + 1}. {item.question}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {item.answer}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => setIsCreating(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveFAQ}
            disabled={!faqName.trim() || saving}
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
        <h3 className="text-lg font-semibold">Preguntas Frecuentes (FAQ)</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Cargando FAQs...</span>
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Sin FAQs</h4>
          <p className="text-gray-600 mb-4">
            Crea tu primer FAQ para ayudar a tus clientes con preguntas comunes.
          </p>
          <button
            onClick={handleCreateFAQ}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear FAQ
          </button>
        </div>
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
    </div>
  )
}