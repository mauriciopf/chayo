'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle, Loader2, AlertCircle, ChevronDown, ChevronRight, Search, X } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  order: number
}

interface FAQ {
  id: string
  name: string
  description: string
  faq_items: FAQItem[]
  updated_at: string
}

interface FAQResponse {
  faqs: FAQ[]
  organization: {
    slug: string
  }
}

interface SearchResponse {
  faq_items: Array<{
    faq_id: string
    faq_name: string
    question: string
    answer: string
    order: number
  }>
  search_query: string
}

export default function FAQsPage() {
  const params = useParams<{ businessSlug: string }>()
  const router = useRouter()
  const businessSlug = (params as any)?.businessSlug as string

  const [faqs, setFAQs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [searching, setSearching] = useState(false)
  const [organizationName, setOrganizationName] = useState<string>('')

  useEffect(() => {
    loadFAQs()
  }, [businessSlug])

  const loadFAQs = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/faqs/${businessSlug}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Esta empresa no tiene FAQs disponibles o no existe.')
        } else {
          setError('Error al cargar las preguntas frecuentes.')
        }
        return
      }

      const data: FAQResponse = await response.json()
      setFAQs(data.faqs || [])
      
      // Try to get organization name from first FAQ if available
      if (data.faqs && data.faqs.length > 0) {
        setOrganizationName(data.faqs[0].name)
      }
    } catch (err) {
      console.error('Error loading FAQs:', err)
      setError('Error al cargar las preguntas frecuentes.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }

    try {
      setSearching(true)
      const response = await fetch(`/api/faqs/${businessSlug}?search=${encodeURIComponent(searchQuery)}`)
      
      if (response.ok) {
        const data: SearchResponse = await response.json()
        setSearchResults(data)
      }
    } catch (err) {
      console.error('Error searching FAQs:', err)
    } finally {
      setSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
  }

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando preguntas frecuentes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </button>
        </div>
      </div>
    )
  }

  const allFAQItems = faqs.flatMap(faq => 
    faq.faq_items.map(item => ({
      ...item,
      faq_name: faq.name,
      faq_id: faq.id
    }))
  ).sort((a, b) => a.order - b.order)

  const displayItems = searchResults ? searchResults.faq_items : allFAQItems

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Preguntas Frecuentes</h1>
              <p className="text-gray-600">
                {organizationName || businessSlug} • {allFAQItems.length} pregunta{allFAQItems.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Buscar en preguntas frecuentes..."
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  onClick={clearSearch}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          {searchQuery && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Buscando...
                  </>
                ) : (
                  'Buscar'
                )}
              </button>
              {searchResults && (
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  Ver todas
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search Results Info */}
        {searchResults && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              {searchResults.faq_items.length === 0 
                ? `No se encontraron resultados para "${searchResults.search_query}"`
                : `${searchResults.faq_items.length} resultado${searchResults.faq_items.length !== 1 ? 's' : ''} para "${searchResults.search_query}"`
              }
            </p>
          </div>
        )}

        {/* FAQ Content */}
        {displayItems.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchResults ? 'No se encontraron resultados' : 'No hay preguntas disponibles'}
            </h3>
            <p className="text-gray-600">
              {searchResults 
                ? 'Intenta con otros términos de búsqueda.'
                : 'Esta empresa aún no ha agregado preguntas frecuentes.'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* FAQ Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="w-6 h-6" />
                <h2 className="text-xl font-semibold">Preguntas Frecuentes</h2>
              </div>
              <p className="text-purple-100 text-sm">
                Encuentra respuestas a las preguntas más comunes
              </p>
            </div>

            {/* FAQ Items */}
            <div className="divide-y divide-gray-200">
              {displayItems.map((item, index) => {
                const itemId = `${item.faq_id || 'search'}-${index}`
                const isExpanded = expandedItems.has(itemId)
                
                return (
                  <div key={itemId} className="hover:bg-gray-50 transition-colors">
                    {/* Question Header */}
                    <button
                      onClick={() => toggleItem(itemId)}
                      className="w-full p-6 text-left flex items-center justify-between group focus:outline-none focus:bg-gray-50"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <span className="text-purple-600 font-semibold text-sm mt-0.5 bg-purple-100 px-2 py-1 rounded">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-left leading-relaxed">
                            {item.question}
                          </h3>
                          {searchResults && item.faq_name && (
                            <p className="text-xs text-purple-600 mt-1 font-medium">
                              {item.faq_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        )}
                      </div>
                    </button>

                    {/* Answer Content */}
                    {isExpanded && (
                      <div className="px-6 pb-6">
                        <div className="ml-12 pl-4 border-l-2 border-purple-100">
                          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {item.answer}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  ¿No encontraste lo que buscabas?
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Contacta directamente para obtener ayuda personalizada
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}