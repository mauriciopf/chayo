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
      alert('Please select a PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB')
      return
    }

    // Confirm replacement if documents exist
    if (documents.length > 0) {
      const confirmReplace = confirm('This will replace your existing document. Continue?')
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
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      console.log('Upload successful:', result)
      
      // Refresh documents list
      await fetchDocuments()
      onSettingsChange?.()
      
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}/agent-documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Delete failed')
      }

      // Refresh documents list
      await fetchDocuments()
      onSettingsChange?.()
      
    } catch (error: any) {
      console.error('Delete error:', error)
      alert(`Delete failed: ${error.message}`)
    }
  }

  if (!isEnabled) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-800 text-sm">
          Enable the Documents tool above to manage client document signing.
        </p>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h3 className="font-medium text-gray-900">Document Management</h3>
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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              {uploading 
                ? (documents.length > 0 ? 'Replacing...' : 'Uploading...') 
                : (documents.length > 0 ? 'Click to replace PDF document' : 'Click to upload PDF document')
              }
            </p>
            <p className="text-xs text-gray-500">
              {documents.length > 0 
                ? 'This will replace your current document • PDF files only, max 10MB'
                : 'PDF files only, max 10MB'
              }
            </p>
          </div>
        </label>
      </div>

      {/* Documents List */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Uploaded Documents</h4>
        {documentLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">No documents uploaded yet</p>
            <p className="text-xs">Upload PDF documents to enable client signing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="w-5 h-5 text-blue-600" />
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
                    title="Delete document"
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