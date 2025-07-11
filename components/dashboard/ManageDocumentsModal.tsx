'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DocumentManager } from './DocumentManager'

interface Document {
  id: string
  filename: string
  file_size: number
  file_type: string
  processed: boolean
  embedding_status: string
  created_at: string
}

interface ManageDocumentsModalProps {
  agentId: string
  agentName: string
  onClose: () => void
}

export default function ManageDocumentsModal({ 
  agentId, 
  agentName, 
  onClose 
}: ManageDocumentsModalProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [agentId])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/documents?agentId=${agentId}`)
      if (response.ok) {
        const { documents } = await response.json()
        setDocuments(documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage Documents</h2>
              <p className="text-sm text-gray-500 mt-1">
                Agent: <span className="font-medium">{agentName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Info Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      Upload PDF documents like business policies, FAQs, or product information 
                      to help your agent provide more accurate and specific responses.
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Manager */}
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <svg className="animate-spin w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="ml-2 text-gray-600">Loading documents...</span>
                </div>
              ) : (
                <DocumentManager
                  agentId={agentId}
                  documents={documents}
                  onDocumentUploaded={fetchDocuments}
                  onDocumentDeleted={fetchDocuments}
                />
              )}

              {/* Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Total Documents:</span>
                  <span className="font-medium text-gray-900">{documents.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-600">Processed:</span>
                  <span className="font-medium text-gray-900">
                    {documents.filter(doc => doc.processed).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-white bg-orange-400 hover:bg-orange-500 rounded-md transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
