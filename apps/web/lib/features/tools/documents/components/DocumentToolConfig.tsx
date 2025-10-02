'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Upload, Trash2 } from 'lucide-react'

interface BusinessDocument {
  id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  signed_file_path?: string
  business_owner_email: string
  created_at: string
  updated_at: string
  signing_url: string
}

interface DocumentToolConfigProps {
  organizationId: string
  isEnabled: boolean
  onSettingsChange?: () => void
}

export default function DocumentToolConfig({ 
  organizationId, 
  isEnabled, 
  onSettingsChange 
}: DocumentToolConfigProps) {
  const [documents, setDocuments] = useState<BusinessDocument[]>([])
  const [uploading, setUploading] = useState(false)
  const [documentLoading, setDocumentLoading] = useState(false)

  useEffect(() => {
    if (isEnabled) {
      fetchDocuments()
    }
  }, [isEnabled, organizationId])

  const fetchDocuments = async () => {
    setDocumentLoading(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}/agent-documents/upload`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setDocumentLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset input
    event.target.value = ''

    if (file.type !== 'application/pdf') {
      alert('Selecciona un archivo PDF')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('El archivo debe pesar menos de 10MB')
      return
    }

    // Confirm replacement if documents exist
    if (documents.length > 0) {
      const confirmReplace = confirm('Esto reemplazará tu documento actual. ¿Deseas continuar?')
      if (!confirmReplace) {
        return
      }
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`/api/organizations/${organizationId}/agent-documents/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falló la carga')
      }

      const result = await response.json()
      console.log('Upload successful:', result)
      
      // Refresh documents list
      await fetchDocuments()
      onSettingsChange?.()
      
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Falló la carga: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este documento? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}/agent-documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falló la eliminación')
      }

      // Refresh documents list
      await fetchDocuments()
      onSettingsChange?.()
      
    } catch (error: any) {
      console.error('Delete error:', error)
      alert(`Falló la eliminación: ${error.message}`)
    }
  }

  if (!isEnabled) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-800 text-sm">
          Activa la herramienta de Documentos para gestionar la firma de tus clientes.
        </p>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText 
          className="w-5 h-5" 
          style={{ color: 'var(--accent-secondary)' }} 
        />
        <h3 
          className="font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          Gestión de documentos
        </h3>
      </div>
      
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
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer"
            style={{ 
              borderColor: 'var(--border-secondary)',
              backgroundColor: 'var(--bg-secondary)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
          >
            <Upload 
              className="w-8 h-8 mx-auto mb-2" 
              style={{ color: 'var(--text-muted)' }} 
            />
            <p 
              className="text-sm mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {uploading 
                ? (documents.length > 0 ? 'Reemplazando...' : 'Subiendo...') 
                : (documents.length > 0 ? 'Haz clic para reemplazar el PDF' : 'Haz clic para subir un PDF')
              }
            </p>
            <p 
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {documents.length > 0 
                ? 'Esto reemplazará tu documento actual • Solo archivos PDF, máximo 10MB'
                : 'Solo archivos PDF, máximo 10MB'
              }
            </p>
          </div>
        </label>
      </div>

      {/* Documents List */}
      <div>
        <h4 
          className="font-medium mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          Documentos cargados
        </h4>
        {documentLoading ? (
          <div className="text-center py-4">
            <div 
              className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto"
              style={{ borderColor: 'var(--accent-secondary)' }}
            ></div>
            <p 
              className="text-sm mt-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Cargando documentos...
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">Aún no subes documentos</p>
            <p className="text-xs">Sube documentos PDF para habilitar la firma de clientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <FileText 
                    className="w-5 h-5" 
                    style={{ color: 'var(--accent-secondary)' }} 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {document.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(document.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      Signing URL: {document.signing_url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteDocument(document.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Eliminar documento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
