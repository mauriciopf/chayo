'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash2, Eye, FileText, Loader2, ExternalLink } from 'lucide-react'

import { supabase } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

// Dynamic import for Form component (for preview)
const Form = dynamic(() => import('react-formio').then(mod => mod.Form), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-4"><Loader2 className="w-6 h-6 animate-spin" /><span className="ml-2">Cargando...</span></div>
})

// Simple Field Types
const FIELD_TYPES = [
  { type: 'textfield', label: 'Texto', icon: '📝', description: 'Campo de texto simple' },
  { type: 'email', label: 'Email', icon: '✉️', description: 'Dirección de correo electrónico' },
  { type: 'number', label: 'Número', icon: '🔢', description: 'Campo numérico' },
  { type: 'phoneNumber', label: 'Teléfono', icon: '📞', description: 'Número de teléfono' },
  { type: 'textarea', label: 'Área de Texto', icon: '📄', description: 'Campo de texto largo' },
  { type: 'select', label: 'Lista', icon: '📋', description: 'Lista desplegable' },
  { type: 'radio', label: 'Opciones (una)', icon: '⚪', description: 'Selección única' },
  { type: 'checkbox', label: 'Casilla', icon: '☑️', description: 'Casilla de verificación' },
  { type: 'selectboxes', label: 'Opciones (múltiples)', icon: '☑️', description: 'Selección múltiple' },
  { type: 'datetime', label: 'Fecha', icon: '📅', description: 'Selector de fecha' }
]

// Simple Form Builder Component
interface SimpleFormBuilderProps {
  formDefinition: any
  onChange: (definition: any) => void
  onFieldClick: (field: any) => void
}

function SimpleFormBuilder({ formDefinition, onChange, onFieldClick }: SimpleFormBuilderProps) {
  const components = formDefinition?.components || []
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [fieldConfig, setFieldConfig] = useState({
    label: '',
    placeholder: '',
    required: false,
    options: ['']
  })

  const addField = (fieldType: string) => {
    const fieldInfo = FIELD_TYPES.find(f => f.type === fieldType)
    if (!fieldInfo) return

    const newField = {
      id: `field_${Date.now()}`,
      type: fieldType,
      label: fieldInfo.label,
      key: `field_${Date.now()}`,
      placeholder: '',
      validate: { required: false },
      ...(fieldType === 'select' || fieldType === 'radio' ? { values: [] } : {}),
      ...(fieldType === 'selectboxes' ? { values: {} } : {})
    }

    const updatedDefinition = {
      ...formDefinition,
      components: [...components, newField]
    }
    
    onChange(updatedDefinition)
  }

  const removeField = (fieldId: string) => {
    const updatedDefinition = {
      ...formDefinition,
      components: components.filter((comp: any) => comp.id !== fieldId)
    }
    onChange(updatedDefinition)
  }

  const getFieldTypeName = (type: string) => {
    const fieldInfo = FIELD_TYPES.find(f => f.type === type)
    return fieldInfo ? fieldInfo.label : type
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

    const newComponents = [...components]
    const draggedItem = newComponents[draggedIndex]
    
    // Remove the dragged item
    newComponents.splice(draggedIndex, 1)
    
    // Adjust the drop index if we're dragging downward
    // When we remove an item from above, indices shift down
    const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex
    
    // Insert at new position
    newComponents.splice(adjustedDropIndex, 0, draggedItem)

    const updatedDefinition = {
      ...formDefinition,
      components: newComponents
    }
    
    onChange(updatedDefinition)
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // Inline editing functions
  const startEditing = (field: any) => {
    setEditingField(field.id)
    setFieldConfig({
      label: field.label || '',
      placeholder: field.placeholder || '',
      required: field.validate?.required || false,
      options: field.values ? field.values.map((v: any) => v.label || v) : ['']
    })
  }

  const saveFieldConfig = () => {
    if (!editingField || !formDefinition) return

    const updatedDefinition = { ...formDefinition }
    const components = updatedDefinition.components || []
    
    const fieldIndex = components.findIndex((comp: any) => comp.id === editingField)
    if (fieldIndex >= 0) {
      const updatedField = {
        ...components[fieldIndex],
        label: fieldConfig.label,
        placeholder: fieldConfig.placeholder,
        validate: {
          ...components[fieldIndex].validate,
          required: fieldConfig.required
        }
      }

      // Add options for select/radio/checkbox fields
      const hasOptions = ['select', 'radio', 'selectboxes'].includes(components[fieldIndex].type)
      if (hasOptions && fieldConfig.options.length > 0) {
        const validOptions = fieldConfig.options.filter(opt => opt.trim())
        if (components[fieldIndex].type === 'select' || components[fieldIndex].type === 'radio') {
          updatedField.values = validOptions.map(opt => ({ label: opt, value: opt }))
        } else if (components[fieldIndex].type === 'selectboxes') {
          updatedField.values = validOptions.reduce((acc: any, opt) => {
            acc[opt] = { label: opt, value: opt }
            return acc
          }, {})
        }
      }

      components[fieldIndex] = updatedField
      updatedDefinition.components = components
      onChange(updatedDefinition)
    }

    setEditingField(null)
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Field Type Buttons */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Tipos de Campos</h4>
        <div className="grid grid-cols-2 gap-3">
          {FIELD_TYPES.map((fieldType) => (
            <button
              key={fieldType.type}
              onClick={() => addField(fieldType.type)}
              className="p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-left group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{fieldType.icon}</span>
                <span className="font-medium text-sm">{fieldType.label}</span>
              </div>
              <p className="text-xs text-gray-500 group-hover:text-purple-600">
                {fieldType.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Form Preview */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Vista Previa del Formulario</h4>
        <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-[400px]">
          {components.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Haz clic en los tipos de campo para agregar</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {components.map((field: any, index: number) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative border border-gray-200 rounded-lg p-3 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all ${
                    draggedIndex === index ? 'opacity-50 scale-95' : ''
                  }`}
                  onClick={() => startEditing(field)}
                >
                  {/* Drag Handle */}
                  <div className="flex items-center gap-3">
                    <div 
                      className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM7 8a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM7 14a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM17 2a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM17 8a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM17 14a2 2 0 1 0-4 0 2 2 0 0 0 4 0z"></path>
                      </svg>
                    </div>
                    
                    <div className="flex-1">
                      {editingField === field.id ? (
                        // Inline editing interface
                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div className="text-xs font-medium text-purple-600 mb-2">
                            ⚙️ Configurando: {getFieldTypeName(field.type)}
                          </div>
                          
                          {/* Label */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Etiqueta *
                            </label>
                            <input
                              type="text"
                              value={fieldConfig.label}
                              onChange={(e) => setFieldConfig({ ...fieldConfig, label: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                              placeholder="Ej: Nombre completo"
                            />
                          </div>

                          {/* Placeholder for text fields */}
                          {['textfield', 'email', 'number', 'phoneNumber', 'textarea'].includes(field.type) && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Texto de ejemplo
                              </label>
                              <input
                                type="text"
                                value={fieldConfig.placeholder}
                                onChange={(e) => setFieldConfig({ ...fieldConfig, placeholder: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="Ej: Ingresa tu nombre"
                              />
                            </div>
                          )}

                          {/* Options for select/radio/checkboxes */}
                          {['select', 'radio', 'selectboxes'].includes(field.type) && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Opciones
                              </label>
                              {fieldConfig.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex gap-1 mb-1">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...fieldConfig.options]
                                      newOptions[optIndex] = e.target.value
                                      setFieldConfig({ ...fieldConfig, options: newOptions })
                                    }}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    placeholder={`Opción ${optIndex + 1}`}
                                  />
                                  {fieldConfig.options.length > 1 && (
                                    <button
                                      onClick={() => {
                                        const newOptions = fieldConfig.options.filter((_, i) => i !== optIndex)
                                        setFieldConfig({ ...fieldConfig, options: newOptions })
                                      }}
                                      className="px-1 text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  setFieldConfig({ ...fieldConfig, options: [...fieldConfig.options, ''] })
                                }}
                                className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Agregar opción
                              </button>
                            </div>
                          )}

                          {/* Required checkbox */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`required-${field.id}`}
                              checked={fieldConfig.required}
                              onChange={(e) => setFieldConfig({ ...fieldConfig, required: e.target.checked })}
                              className="mr-2"
                            />
                            <label htmlFor={`required-${field.id}`} className="text-xs text-gray-700">
                              Campo obligatorio
                            </label>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={saveFieldConfig}
                              disabled={!fieldConfig.label.trim()}
                              className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Normal field display
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {field.label || getFieldTypeName(field.type)}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {getFieldTypeName(field.type)}
                            </span>
                            {field.validate?.required && (
                              <span className="text-xs text-red-500">*</span>
                            )}
                          </div>
                          {field.placeholder && (
                            <p className="text-xs text-gray-500">
                              Placeholder: {field.placeholder}
                            </p>
                          )}
                          {(field.values && Array.isArray(field.values) && field.values.length > 0) && (
                            <p className="text-xs text-gray-500">
                              Opciones: {field.values.map((v: any) => v.label || v).join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeField(field.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Drop indicator */}
                  {draggedIndex !== null && draggedIndex !== index && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}
                  
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-300 rounded-lg pointer-events-none"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface IntakeFormsToolConfigProps {
  organizationId: string
  isEnabled: boolean
  onSettingsChange?: () => void
}

interface IntakeForm {
  id: string
  name: string
  description?: string
  formio_definition?: any
  is_active: boolean
  created_at: string
}

export default function IntakeFormsToolConfig({ organizationId, isEnabled, onSettingsChange }: IntakeFormsToolConfigProps) {
  const [forms, setForms] = useState<IntakeForm[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormBuilder, setShowFormBuilder] = useState(false)
  const [editingForm, setEditingForm] = useState<IntakeForm | null>(null)
  const [formName, setFormName] = useState('')
  const [formDefinition, setFormDefinition] = useState<any>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  


  // Load forms
  useEffect(() => {
    if (isEnabled) {
      loadForms()
    }
  }, [isEnabled, organizationId])

  const loadForms = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('intake_forms')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setForms(data || [])
    } catch (error) {
      console.error('Error loading forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateForm = () => {
    setEditingForm(null)
    setFormName('')
    setFormDefinition({
      type: 'form',
      components: [],
      display: 'form'
    })
    setIsPreview(false)
    setShowFormBuilder(true)
  }

  const handleEditForm = (form: IntakeForm) => {
    setEditingForm(form)
    setFormName(form.name)
    setFormDefinition(form.formio_definition || {
      type: 'form',
      components: [],
      display: 'form'
    })
    setIsPreview(false)
    setShowFormBuilder(true)
  }

  const handleSaveForm = async () => {
    if (!formName.trim() || !formDefinition) return

    try {
      setSaving(true)
      
      const formData = {
        name: formName.trim(),
        description: null,
        formio_definition: formDefinition,
        organization_id: organizationId,
        is_active: true
      }

      if (editingForm) {
        // Update existing form
        const { error } = await supabase
          .from('intake_forms')
          .update(formData)
          .eq('id', editingForm.id)

        if (error) throw error
      } else {
        // For new forms, delete any existing ones first (one form only)
        await supabase
          .from('intake_forms')
          .delete()
          .eq('organization_id', organizationId)

        // Create new form
        const { error } = await supabase
          .from('intake_forms')
          .insert(formData)

        if (error) throw error
      }

      await loadForms()
      setShowFormBuilder(false)
      setEditingForm(null)
      setFormName('')
      setFormDefinition(null)

    } catch (error) {
      console.error('Error saving form:', error)
      alert('Error al guardar el formulario')
    } finally {
      setSaving(false)
    }
  }



  const handleDeleteForm = async (formId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este formulario?')) return

    try {
      const { error } = await supabase
        .from('intake_forms')
        .delete()
        .eq('id', formId)

      if (error) throw error
      await loadForms()
    } catch (error) {
      console.error('Error deleting form:', error)
      alert('Error al eliminar el formulario')
    }
  }

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/fill-form/${formId}`
    navigator.clipboard.writeText(link)
    alert('Enlace copiado al portapapeles')
  }

  if (!isEnabled) {
    return (
      <div className="p-4 text-center text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>La herramienta de formularios de admisión no está habilitada.</p>
      </div>
    )
  }

  if (showFormBuilder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {editingForm ? 'Editar Formulario' : 'Crear Formulario'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreview(!isPreview)}
              disabled={!formDefinition}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreview ? 'Editor' : 'Vista Previa'}
            </button>
            <button
              onClick={() => {
                setShowFormBuilder(false)
                setEditingForm(null)
                setFormName('')
                setFormDefinition(null)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Formulario *
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Ej: Formulario de Admisión"
            required
          />
        </div>

        {isPreview ? (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-md font-medium mb-4">Vista Previa del Formulario</h4>
            {formDefinition && (
              <Form 
                form={formDefinition}
                onSubmit={(submission: any) => {
                  console.log('Preview submission:', submission)
                  alert('Esta es solo una vista previa. Los datos no se guardan.')
                }}
                options={{
                  readOnly: true,
                  noAlerts: false
                }}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Helpful instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Cómo usar el constructor</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>1.</strong> Haz clic en los botones de campo para agregar al formulario</p>
                <p><strong>2.</strong> Arrastra los campos para reordenarlos arriba/abajo</p>
                <p><strong>3.</strong> Haz clic en cualquier campo para editarlo directamente</p>
                <p><strong>4.</strong> Usa "Vista Previa" para ver cómo se verá el formulario</p>
              </div>
            </div>
            
            <SimpleFormBuilder
              formDefinition={formDefinition}
              onChange={setFormDefinition}
              onFieldClick={() => {}} // Not used anymore - inline editing handles this
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={handleSaveForm}
            disabled={!formName.trim() || !formDefinition || saving}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              editingForm ? 'Actualizar Formulario' : 'Crear Formulario'
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Formularios de Admisión</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Cargando formularios...</span>
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Sin formularios</h4>
          <p className="text-gray-600 mb-4">
            Crea tu formulario de admisión para recopilar información de tus clientes.
          </p>
          <button
            onClick={handleCreateForm}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear formulario
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {forms.map((form) => (
            <div key={form.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{form.name}</h4>
                  {form.description && (
                    <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {form.formio_definition ? 'Formulario construido' : 'Sin definición'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyFormLink(form.id)}
                    className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Copiar enlace
                  </button>
                  <button
                    onClick={() => handleEditForm(form)}
                    className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteForm(form.id)}
                    className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
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