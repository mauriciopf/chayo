'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, File, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Document {
  id: string
  filename: string
  file_size: number
  file_type: string
  processed: boolean
  embedding_status: string
  created_at: string
}

interface DocumentManagerProps {
  agentId: string
  documents: Document[]
  onDocumentUploaded: () => void
  onDocumentDeleted: () => void
}

export function DocumentManager({ agentId, documents, onDocumentUploaded, onDocumentDeleted }: DocumentManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations('documentManager')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError(t('errors.onlyPdf'))
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(t('errors.fileSize'))
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('agentId', agentId)

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        onDocumentUploaded()
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setError(result.error || t('errors.uploadFailed'))
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError(t('errors.uploadFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm(t('confirmDelete'))) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDocumentDeleted()
      } else {
        const result = await response.json()
        setError(result.error || t('errors.deleteFailed'))
      }
    } catch (error) {
      console.error('Delete error:', error)
      setError(t('errors.deleteFailed'))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('title')}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('uploadDescription')}
        </p>
      </div>

      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                {t('uploadDocument')}
              </span>
              <span className="mt-1 block text-sm text-gray-600">
                {t('dragDropText')}
              </span>
            </label>
            <input
              ref={fileInputRef}
              id="file-upload"
              name="file-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="sr-only"
            />
          </div>
          <div className="mt-4">
            <Button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  {t('processing')}
                </>
              ) : (
                <>
                  <Upload className="-ml-1 mr-2 h-4 w-4" />
                  {t('uploadButton')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      {documents.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">{t('title')}</h4>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(doc.embedding_status)}
                  <span className="text-xs text-gray-500 capitalize">
                    {doc.embedding_status === 'completed' ? t('processed') : 
                     doc.embedding_status === 'processing' ? t('processing') : 
                     doc.embedding_status === 'error' ? t('failed') : doc.embedding_status}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="text-red-600 hover:text-red-700"
                    title={t('deleteDocument')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">{t('noDocuments')}</p>
        </div>
      )}
    </div>
  )
}
