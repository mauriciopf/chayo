'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import dynamic from 'next/dynamic'

// Dynamically import Form.io components to avoid SSR issues
const FormioForm = dynamic(() => import('react-formio').then(mod => mod.Form), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
})

interface FormField {
  id: string
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio'
  required: boolean
  options?: string[]
  placeholder?: string
}

interface IntakeForm {
  id: string
  name: string
  description: string
  fields: FormField[] // Legacy field, empty for Form.io forms
  formio_definition?: any
  organization: {
    name: string
    slug: string
  }
}

export default function FillFormPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.formId as string

  const [form, setForm] = useState<IntakeForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [anonymousUserId, setAnonymousUserId] = useState<string | null>(null)

  useEffect(() => {
    loadForm()
    getAnonymousSession()
  }, [formId])

  const getAnonymousSession = async () => {
    // Get or create anonymous session (similar to document signing)
    const storedSession = localStorage.getItem('chayo_anonymous_session')
    if (storedSession) {
      const sessionData = JSON.parse(storedSession)
      setAnonymousUserId(sessionData.user?.id || null)
    } else {
      // Create new anonymous session
      try {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase.auth.signInAnonymously()
        if (data.user) {
          localStorage.setItem('chayo_anonymous_session', JSON.stringify(data))
          setAnonymousUserId(data.user.id)
        }
      } catch (error) {
        console.error('Error creating anonymous session:', error)
      }
    }
  }

  const loadForm = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/intake-forms/${formId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Formulario no encontrado')
        } else if (response.status === 400) {
          const errorData = await response.json()
          setError(errorData.error || 'Este formulario ya no está disponible')
        } else {
          throw new Error('Error loading form')
        }
        return
      }

      const data = await response.json()
      setForm(data.form)

      // Initialize form data with empty values
      const initialData: Record<string, any> = {}
      data.form.fields.forEach((field: FormField) => {
        if (field.type === 'checkbox') {
          initialData[field.name] = []
        } else {
          initialData[field.name] = ''
        }
      })
      setFormData(initialData)
    } catch (error: any) {
      setError('Error cargando el formulario')
      console.error('Error loading form:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (fieldName: string, value: any, fieldType: string) => {
    if (fieldType === 'checkbox') {
      const currentValues = formData[fieldName] || []
      if (currentValues.includes(value)) {
        setFormData({
          ...formData,
          [fieldName]: currentValues.filter((v: any) => v !== value)
        })
      } else {
        setFormData({
          ...formData,
          [fieldName]: [...currentValues, value]
        })
      }
    } else {
      setFormData({
        ...formData,
        [fieldName]: value
      })
    }
  }

  const validateForm = () => {
    if (!form) return false

    for (const field of form.fields) {
      if (field.required) {
        const value = formData[field.name]
        if (!value || (typeof value === 'string' && value.trim() === '') || 
            (Array.isArray(value) && value.length === 0)) {
          return false
        }
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/intake-forms/${formId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: formData,
          clientName: formData.name || formData.client_name || null,
          clientEmail: formData.email || formData.client_email || null,
          anonymousUserId: anonymousUserId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al enviar el formulario')
      }

      setSubmitted(true)
      
      // Redirect to client chat after a delay
      setTimeout(() => {
        if (form?.organization.slug) {
          router.push(`/client-chat/${form.organization.slug}`)
        }
      }, 3000)

    } catch (error: any) {
      alert(error.message)
      console.error('Error submitting form:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Form.io submission handler
  const handleFormioSubmit = async (submission: any) => {
    console.log('Form.io submission received:', submission)
    setSubmitting(true)
    
    try {
      // Extract data from Form.io submission object
      const formData = submission.data || submission
      
      const response = await fetch(`/api/intake-forms/${formId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: formData,
          clientName: formData.name || formData.client_name || (formData.firstName && formData.lastName ? `${formData.firstName} ${formData.lastName}` : null),
          clientEmail: formData.email || formData.client_email || null,
          anonymousUserId: anonymousUserId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al enviar el formulario')
      }

      setSubmitted(true)
      
      // Redirect to client chat after a delay
      setTimeout(() => {
        if (form?.organization.slug) {
          router.push(`/client-chat/${form.organization.slug}`)
        }
      }, 3000)

    } catch (error: any) {
      alert(error.message)
      console.error('Error submitting form:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.name] || ''

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
            required={field.required}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required={field.required}
          />
        )

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
            required={field.required}
          >
            <option value="">Selecciona una opción...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
                  className="w-5 h-5 text-purple-600"
                  required={field.required}
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={(value || []).includes(option)}
                  onChange={(e) => handleInputChange(field.name, option, field.type)}
                  className="w-5 h-5 text-purple-600 rounded"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600">Cargando formulario...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">¡Formulario Enviado!</h1>
          <p className="text-gray-600 mb-4">
            Gracias por completar el formulario. Te redirigiremos al chat en unos segundos.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirigiendo...
          </div>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Formulario no encontrado</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{form.name}</h1>
              <p className="text-sm text-gray-600">{form.organization.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            {form.description && (
              <div className="mb-6">
                <p className="text-gray-700">{form.description}</p>
              </div>
            )}

            {form.formio_definition ? (
              // Form.io form rendering
              <div className="space-y-6">
                <FormioForm
                  form={form.formio_definition}
                  onSubmit={handleFormioSubmit}
                  options={{
                    readOnly: false,
                    noAlerts: false,
                    submitMessage: 'Enviando...'
                  }}
                />
                {submitting && (
                  <div className="flex items-center justify-center gap-2 text-purple-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando formulario...</span>
                  </div>
                )}
              </div>
            ) : (
              // Fallback: Legacy custom form rendering
              <form onSubmit={handleSubmit} className="space-y-6">
                {form.fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))}

                <div className="pt-6 border-t">
                  <button
                    type="submit"
                    disabled={submitting || !validateForm()}
                    className="w-full px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Formulario
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}