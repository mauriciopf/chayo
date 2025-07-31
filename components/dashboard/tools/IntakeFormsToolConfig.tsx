'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Eye, Settings, FileText, Loader2 } from 'lucide-react'

interface IntakeFormsToolConfigProps {
  organizationId: string
  isEnabled: boolean
  onSettingsChange?: () => void
}

type FieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio'

interface FormField {
  id: string
  name: string
  label: string
  type: FieldType
  required: boolean
  options?: string[] // For select, checkbox, radio
  placeholder?: string
}

interface IntakeForm {
  id: string
  organization_id: string
  name: string
  description: string
  fields: FormField[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function IntakeFormsToolConfig({ organizationId, isEnabled, onSettingsChange }: IntakeFormsToolConfigProps) {
  const [loading, setLoading] = useState(true)
  const [forms, setForms] = useState<IntakeForm[]>([])
  const [showFormBuilder, setShowFormBuilder] = useState(false)
  const [editingForm, setEditingForm] = useState<IntakeForm | null>(null)

  const loadForms = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}/intake-forms`)
      if (response.ok) {
        const data = await response.json()
        setForms(data.forms || [])
      }
    } catch (error) {
      console.error('Error loading intake forms:', error)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (isEnabled) {
      loadForms()
    }
  }, [isEnabled, loadForms])

  const handleCreateForm = () => {
    setEditingForm(null)
    setShowFormBuilder(true)
  }

  const handleEditForm = (form: IntakeForm) => {
    setEditingForm(form)
    setShowFormBuilder(true)
  }

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}/intake-forms/${formId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete form')
      }

      setForms(forms.filter(form => form.id !== formId))
      onSettingsChange?.()
      alert('Form deleted successfully!')
    } catch (error: any) {
      alert(`Error deleting form: ${error.message}`)
      console.error('Error deleting form:', error)
    }
  }

  const handleToggleFormStatus = async (formId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/intake-forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update form status')
      }

      setForms(forms.map(form => 
        form.id === formId ? { ...form, is_active: isActive } : form
      ))
      onSettingsChange?.()
    } catch (error: any) {
      alert(`Error updating form status: ${error.message}`)
      console.error('Error updating form status:', error)
    }
  }

  if (!isEnabled) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Cargando formularios...</span>
      </div>
    )
  }

  if (showFormBuilder) {
    return (
      <FormBuilder
        organizationId={organizationId}
        form={editingForm}
        onSave={(form) => {
          if (editingForm) {
            setForms(forms.map(f => f.id === form.id ? form : f))
          } else {
            setForms([...forms, form])
          }
          setShowFormBuilder(false)
          setEditingForm(null)
          onSettingsChange?.()
        }}
        onCancel={() => {
          setShowFormBuilder(false)
          setEditingForm(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Gestión de Formularios</h3>
        <button
          onClick={handleCreateForm}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Crear Formulario
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No hay formularios</h4>
          <p className="text-gray-600 mb-4">
            Crea tu primer formulario para recopilar información de clientes
          </p>
          <button
            onClick={handleCreateForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Crear Primer Formulario
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <div key={form.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{form.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      form.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {form.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{form.description}</p>
                  <div className="text-xs text-gray-500">
                    {form.fields.length} campos • Creado {new Date(form.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFormStatus(form.id, !form.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      form.is_active 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                    title={form.is_active ? 'Desactivar' : 'Activar'}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditForm(form)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteForm(form.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title="Eliminar"
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

// Form Builder Component
interface FormBuilderProps {
  organizationId: string
  form: IntakeForm | null
  onSave: (form: IntakeForm) => void
  onCancel: () => void
}

function FormBuilder({ organizationId, form, onSave, onCancel }: FormBuilderProps) {
  const [formName, setFormName] = useState(form?.name || '')
  const [formDescription, setFormDescription] = useState(form?.description || '')
  const [fields, setFields] = useState<FormField[]>(form?.fields || [])
  const [saving, setSaving] = useState(false)

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Texto' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Teléfono' },
    { value: 'textarea', label: 'Área de texto' },
    { value: 'select', label: 'Lista desplegable' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Opción múltiple' }
  ]

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      name: `field_${fields.length + 1}`,
      label: `Campo ${fields.length + 1}`,
      type: 'text',
      required: false
    }
    setFields([...fields, newField])
  }

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...fields]
    updatedFields[index] = { ...updatedFields[index], ...updates }
    setFields(updatedFields)
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      alert('El nombre del formulario es requerido')
      return
    }

    if (fields.length === 0) {
      alert('Debe agregar al menos un campo al formulario')
      return
    }

    setSaving(true)
    try {
      const method = form ? 'PUT' : 'POST'
      const url = form 
        ? `/api/organizations/${organizationId}/intake-forms/${form.id}`
        : `/api/organizations/${organizationId}/intake-forms`

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          fields: fields
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save form')
      }

      const savedForm = await response.json()
      onSave(savedForm.form)
      alert('Formulario guardado exitosamente!')
    } catch (error: any) {
      alert(`Error guardando formulario: ${error.message}`)
      console.error('Error saving form:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          {form ? 'Editar Formulario' : 'Crear Nuevo Formulario'}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </div>

      {/* Form Details */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Formulario *
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Ej: Formulario de Registro de Clientes"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Describe el propósito de este formulario..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Form Fields */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Campos del Formulario</h4>
          <button
            onClick={addField}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar Campo
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etiqueta del Campo
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Campo
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {fieldTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Campo (técnico)
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(index, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placeholder (opcional)
                  </label>
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {['select', 'checkbox', 'radio'].includes(field.type) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opciones (una por línea)
                  </label>
                  <textarea
                    value={(field.options || []).join('\n')}
                    onChange={(e) => updateField(index, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                    placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    className="rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Campo requerido</span>
                </label>
                <button
                  onClick={() => removeField(index)}
                  className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No hay campos en este formulario</p>
              <button
                onClick={addField}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar Primer Campo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}