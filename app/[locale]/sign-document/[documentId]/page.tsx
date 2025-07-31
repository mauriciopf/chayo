'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface DocumentData {
  id: string
  file_name: string
  file_path: string
  file_size: number
  status: string
  organization_id: string
}

export default function SignDocumentPage() {
  const params = useParams()
  const documentId = params.documentId as string
  
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string>('')
  
  // PDF form fields
  const [formFields, setFormFields] = useState<any[]>([])
  const [fieldValues, setFieldValues] = useState<{[key: string]: string}>({})
  const [hasFormFields, setHasFormFields] = useState(false)
  
  // Signing form data
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')

  useEffect(() => {
    fetchDocument()
  }, [documentId])

  const analyzePdfFormFields = async (pdfBlob: Blob) => {
    try {
      const pdfBytes = await pdfBlob.arrayBuffer()
      const pdfDoc = await PDFDocument.load(pdfBytes)
      
      // Get the form from the PDF
      const form = pdfDoc.getForm()
      const fields = form.getFields()
      
      if (fields.length > 0) {
        console.log(`Found ${fields.length} form fields in PDF`)
        
        const formFieldsData = fields.map((field, index) => {
          const fieldName = field.getName()
          const fieldType = field.constructor.name
          
          // Try to get current value if it exists
          let currentValue = ''
          try {
            if (fieldType === 'PDFTextField') {
              currentValue = (field as any).getText() || ''
            } else if (fieldType === 'PDFCheckBox') {
              currentValue = (field as any).isChecked() ? 'true' : 'false'
            } else if (fieldType === 'PDFDropdown') {
              currentValue = (field as any).getSelected()?.[0] || ''
            }
          } catch (e) {
            // Field might not have a value yet
          }
          
          return {
            id: `field_${index}`,
            name: fieldName,
            type: fieldType,
            currentValue,
            required: false // We'll assume all fields are optional for now
          }
        })
        
        setFormFields(formFieldsData)
        setHasFormFields(true)
        
        // Initialize field values
        const initialValues: {[key: string]: string} = {}
        formFieldsData.forEach(field => {
          initialValues[field.name] = field.currentValue
        })
        setFieldValues(initialValues)
        
      } else {
        console.log('No form fields found in PDF')
        setHasFormFields(false)
      }
    } catch (error) {
      console.error('Error analyzing PDF form fields:', error)
      setHasFormFields(false)
    }
  }

  const fetchDocument = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sign-document/${documentId}`)
      
      if (!response.ok) {
        throw new Error('Document not found')
      }

      const data = await response.json()
      setDocument(data.document)

      // Get signed URL for PDF viewing and analyze form fields
      const pdfResponse = await fetch(`/api/sign-document/${documentId}/pdf`)
      if (pdfResponse.ok) {
        const pdfBlob = await pdfResponse.blob()
        const url = URL.createObjectURL(pdfBlob)
        setPdfUrl(url)

        // Analyze PDF for form fields
        await analyzePdfFormFields(pdfBlob)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  const handleSign = async () => {
    if (!signerName || !signerEmail) {
      setError('Please fill in your name and email')
      return
    }

    // If there are form fields, check if required ones are filled
    if (hasFormFields) {
      const missingFields = formFields.filter(field => 
        field.required && (!fieldValues[field.name] || fieldValues[field.name].trim() === '')
      )
      if (missingFields.length > 0) {
        setError(`Please fill in required fields: ${missingFields.map(f => f.name).join(', ')}`)
        return
      }
    }

    try {
      setSigning(true)
      setError('')

      // Fetch the original PDF
      const pdfResponse = await fetch(`/api/sign-document/${documentId}/pdf`)
      if (!pdfResponse.ok) {
        throw new Error('Failed to load PDF')
      }

      const pdfBytes = await pdfResponse.arrayBuffer()
      
      // Load PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(pdfBytes)
      
      // If PDF has form fields, fill them
      if (hasFormFields && formFields.length > 0) {
        const form = pdfDoc.getForm()
        
        formFields.forEach(fieldData => {
          const value = fieldValues[fieldData.name]
          if (value) {
            try {
              const field = form.getField(fieldData.name)
              
              if (fieldData.type === 'PDFTextField') {
                (field as any).setText(value)
              } else if (fieldData.type === 'PDFCheckBox') {
                if (value.toLowerCase() === 'true' || value === '1') {
                  (field as any).check()
                } else {
                  (field as any).uncheck()
                }
              } else if (fieldData.type === 'PDFDropdown') {
                (field as any).select(value)
              }
              
              console.log(`Filled field "${fieldData.name}" with value: ${value}`)
            } catch (error) {
              console.error(`Error filling field "${fieldData.name}":`, error)
            }
          }
        })
        
        // Flatten the form to make it non-editable
        form.flatten()
      }
      
      // Note: If no form fields exist, we just save the PDF as-is
      // The signer's name and email will be stored in the database

      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save()
      
      // Submit signed document
      const formData = new FormData()
      formData.append('signedPdf', new Blob([signedPdfBytes], { type: 'application/pdf' }))
      formData.append('signerName', signerName)
      formData.append('signerEmail', signerEmail)
      
      const submitResponse = await fetch(`/api/sign-document/${documentId}/submit`, {
        method: 'POST',
        body: formData
      })

      if (!submitResponse.ok) {
        throw new Error('Failed to submit signed document')
      }

      // Success! Show confirmation
      alert('¡Documento firmado exitosamente! The business owner will be notified.')
      
      // Optionally redirect or show success state
      window.close() // Close if opened in new tab
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign document')
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando documento...</p>
        </div>
      </div>
    )
  }

  if (error && !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Firmar Documento: {document?.file_name}
          </h1>
          <p className="text-gray-600 mt-1">
            Complete the information below and add your signature to finalize the document.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* PDF Viewer */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Document Preview</h2>
            {pdfUrl ? (
              <iframe 
                src={pdfUrl}
                className="w-full h-[600px] border rounded"
                title="PDF Document"
              />
            ) : (
              <div className="w-full h-[600px] border rounded flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Loading PDF...</p>
              </div>
            )}
          </div>

          {/* Signing Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Signing Information</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="signerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="signerName"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="signerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="signerEmail"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              {/* PDF Form Fields */}
              {hasFormFields && formFields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-900 border-t pt-4">
                    Document Fields
                  </h3>
                  {formFields.map((field) => (
                    <div key={field.id}>
                      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-1">
                        {field.name} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      
                      {field.type === 'PDFTextField' && (
                        <input
                          type="text"
                          id={field.id}
                          value={fieldValues[field.name] || ''}
                          onChange={(e) => setFieldValues(prev => ({
                            ...prev,
                            [field.name]: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Enter ${field.name}`}
                        />
                      )}
                      
                      {field.type === 'PDFCheckBox' && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={field.id}
                            checked={fieldValues[field.name] === 'true'}
                            onChange={(e) => setFieldValues(prev => ({
                              ...prev,
                              [field.name]: e.target.checked ? 'true' : 'false'
                            }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={field.id} className="ml-2 text-sm text-gray-700">
                            Check this box
                          </label>
                        </div>
                      )}
                      
                      {field.type === 'PDFDropdown' && (
                        <select
                          id={field.id}
                          value={fieldValues[field.name] || ''}
                          onChange={(e) => setFieldValues(prev => ({
                            ...prev,
                            [field.name]: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select an option</option>
                          {/* Note: We'd need to get dropdown options from pdf-lib, for now just basic */}
                        </select>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {field.type.replace('PDF', '')}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!hasFormFields && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    This PDF doesn't contain fillable form fields. Your signature will be recorded with your name and email for verification purposes.
                  </p>
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleSign}
                  disabled={signing || !signerName || !signerEmail}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signing ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Signing Document...
                    </>
                  ) : (
                    'Sign Document'
                  )}
                </button>
              </div>

              <div className="text-xs text-gray-500 pt-2">
                <p>
                  By clicking "Sign Document", you agree that the information provided constitutes your legal signature 
                  and you accept the terms of this document. {hasFormFields && 'Your form field entries will be permanently saved to the document.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}