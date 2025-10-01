'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface BusinessSummaryData {
  success: boolean
  summary: string
  rawData?: any
  error?: string
}

export default function BusinessSummary() {
  const t = useTranslations('dashboard')
  const [summaryData, setSummaryData] = useState<BusinessSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRawData, setShowRawData] = useState(false)

  useEffect(() => {
    fetchBusinessSummary()
  }, [])

  const fetchBusinessSummary = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/business-summary')
      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404) {
          setSummaryData({
            success: false,
            summary: data.summary || 'No business information has been collected yet.',
            error: data.error
          })
        } else {
          throw new Error(data.error || 'Failed to fetch business summary')
        }
      } else {
        setSummaryData(data)
      }
    } catch (err) {
      console.error('Error fetching business summary:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
        {/* Clean Header - Same as main design */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mr-4"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="text-left">
              <h1 
                className="text-4xl font-bold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Cerebro de Chayo
              </h1>
              <p 
                className="text-xl"
                style={{ color: 'var(--text-secondary)' }}
              >
                Ve todo lo que Chayo sabe sobre tu negocio - toda la información que ha aprendido de tus conversaciones
              </p>
            </div>
          </div>
        </motion.div>

        {/* Loading Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-12 shadow-xl border flex items-center justify-center"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            minHeight: '400px'
          }}
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-t-transparent rounded-full mx-auto mb-6"
              style={{
                borderColor: 'var(--accent-primary)',
                borderTopColor: 'transparent'
              }}
            />
            <h3 
              className="text-2xl font-bold mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              Cargando Inteligencia de Negocio
            </h3>
            <p 
              className="text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              Analizando los datos de tu negocio...
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
        {/* Clean Header - Same as main design */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mr-4"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="text-left">
              <h1 
                className="text-4xl font-bold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Cerebro de Chayo
              </h1>
              <p 
                className="text-xl"
                style={{ color: 'var(--text-secondary)' }}
              >
                Ve todo lo que Chayo sabe sobre tu negocio - toda la información que ha aprendido de tus conversaciones
              </p>
            </div>
          </div>
        </motion.div>

        {/* Error Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-12 shadow-xl border flex items-center justify-center"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            minHeight: '400px'
          }}
        >
          <div className="text-center max-w-md">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <svg 
                className="w-10 h-10" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#ef4444' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 
              className="text-2xl font-bold mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              No se Pudo Cargar el Resumen
            </h3>
            <p 
              className="text-lg mb-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              {error}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchBusinessSummary}
              className="px-8 py-3 rounded-xl transition-all duration-200 font-medium"
              style={{ 
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
            >
              Intentar de Nuevo
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Clean Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center mb-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mr-4"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="text-left">
            <h1 
              className="text-4xl font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Chayo's Brain
            </h1>
            <p 
              className="text-xl"
              style={{ color: 'var(--text-secondary)' }}
            >
              See everything Chayo knows about your business - all the information she has learned from your conversations
            </p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchBusinessSummary}
          className="px-6 py-3 rounded-xl transition-all duration-200 font-medium flex items-center space-x-2 mx-auto"
          style={{ 
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--text-primary)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Actualizar</span>
        </motion.button>
      </motion.div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-8 shadow-xl border"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        {summaryData?.summary ? (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 
                    className="text-2xl font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {showRawData ? 'Datos Crudos del Negocio' : 'Resumen de Inteligencia de Negocio'}
                  </h2>
                  <p 
                    className="text-lg"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {showRawData ? 'Estructura de datos técnicos' : 'Todo lo que Chayo sabe sobre tu negocio'}
                  </p>
                </div>
              </div>
              
              {summaryData?.rawData && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowRawData(!showRawData)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-colors"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showRawData ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"} />
                  </svg>
                  <span>{showRawData ? 'Mostrar Resumen' : 'Mostrar Datos Crudos'}</span>
                </motion.button>
              )}
            </div>

            {/* Content */}
            <div 
              className="rounded-xl p-6 border"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              {showRawData ? (
                // Raw Data View
                <pre 
                  className="text-sm font-mono whitespace-pre-wrap leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {JSON.stringify(summaryData.rawData, null, 2)}
                </pre>
              ) : (
                // Formatted Summary View - Much more readable
                <div 
                  className="max-w-none leading-relaxed"
                  style={{ 
                    color: 'var(--text-primary)',
                    lineHeight: '1.8',
                    fontSize: '18px',
                    fontWeight: '400'
                  }}
                >
                  <div
                    className="business-summary-content"
                    style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: formatMarkdownToHTML(summaryData.summary) 
                    }}
                  />
                </div>
              )}
            </div>

            {/* Footer Info */}
            <div 
              className="flex items-center justify-center text-sm pt-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Última actualización: {new Date().toLocaleDateString()}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <svg 
                  className="w-12 h-12" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 
                className="text-2xl font-semibold mb-3"
                style={{ color: 'var(--text-primary)' }}
              >Aún No Hay Información del Negocio</h3>
              <p 
                className="mb-8 max-w-md mx-auto"
                style={{ color: 'var(--text-secondary)' }}
              >
                Inicia una conversación con tu asistente IA para comenzar a recopilar los detalles de tu negocio. Chayo aprenderá sobre tu negocio mientras chateas.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="px-8 py-3 rounded-lg transition-all duration-200 font-medium shadow-lg"
                style={{ 
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--text-primary)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
              >
                Actualizar Resumen
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

/**
 * Enhanced markdown to HTML converter with better styling
 */
function formatMarkdownToHTML(markdown: string): string {
  return markdown
    // Headers with better styling
    .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-gray-900 mb-6 mt-8 first:mt-0 border-b border-gray-200 pb-3">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold text-gray-800 mb-4 mt-6 first:mt-0">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium text-gray-700 mb-3 mt-5 first:mt-0">$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4 class="text-lg font-medium text-gray-700 mb-2 mt-4 first:mt-0">$1</h4>')
    
    // Bold and italic text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
    
    // Code blocks and inline code
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto my-4 border border-gray-200"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">$1</code>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-purple-600 hover:text-purple-700 underline" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Bullet points with better styling
    .replace(/^[•\-\*] (.*$)/gm, '<li class="mb-2 text-gray-700 flex items-start"><span class="text-purple-500 mr-3 mt-1">•</span><span>$1</span></li>')
    
    // Numbered lists
    .replace(/^\d+\. (.*$)/gm, '<li class="mb-2 text-gray-700 list-decimal ml-4">$1</li>')
    
    // Blockquotes
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-purple-300 pl-4 py-2 my-4 bg-purple-50 text-gray-700 italic">$1</blockquote>')
    
    // Paragraphs and line breaks
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, '<br>')
    
    // Wrap everything in a paragraph container
    .replace(/^/, '<p class="mb-4">')
    .replace(/$/, '</p>')
    
    // Clean up list formatting
    .replace(/(<li.*?<\/li>)/g, (match, listItem) => {
      return `<ul class="space-y-2 mb-4">${listItem}</ul>`
    })
    
    // Clean up empty paragraphs
    .replace(/<p class="mb-4"><\/p>/g, '')
    .replace(/<p class="mb-4">(<h[1-6])/g, '$1')
    .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
} 