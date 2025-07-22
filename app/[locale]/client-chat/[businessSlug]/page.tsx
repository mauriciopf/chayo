"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ClientChatContainer from '@/components/dashboard/ClientChatContainer'
import { Agent, Organization } from '@/components/dashboard/types'
import { createClient } from '@/lib/supabase/client'

export default function ClientChatBusinessPage() {
  const params = useParams()
  const businessSlug = params.businessSlug as string
  const [agent, setAgent] = useState<Agent | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchBusinessAgent = async () => {
      try {
        if (!businessSlug) {
          setError('No business slug provided')
          setLoading(false)
          return
        }
        // Fetch organization by slug
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', businessSlug)
          .single()
        if (orgError || !orgData) {
          setError('Business not found')
          setLoading(false)
          return
        }
        setOrganization(orgData)
        // Fetch agent for this organization (assume one agent per business)
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('organization_id', orgData.id)
          .single()
        if (agentError || !agentData) {
          setError('Chat agent not found for this business')
          setLoading(false)
          return
        }
        setAgent(agentData)
        setLoading(false)
      } catch (err) {
        setError('Failed to load chat')
        setLoading(false)
      }
    }
    fetchBusinessAgent()
  }, [businessSlug, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }
  if (error || !agent || !organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Chat Not Available</h1>
          <p className="text-gray-600 mb-4">{error || 'This chat link is not valid'}</p>
          <p className="text-sm text-gray-500">Please contact the business for a valid chat link</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🤖</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Chat with {organization.name}
              </h1>
              <p className="text-sm text-gray-600">
                Tu Comadre Digital - AI Business Assistant
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <ClientChatContainer 
            agent={agent}
            className="h-[calc(100vh-200px)]"
          />
        </div>
      </div>
      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-500">
          Powered by Chayo AI • Tu Comadre Digital
        </p>
      </div>
    </div>
  )
} 