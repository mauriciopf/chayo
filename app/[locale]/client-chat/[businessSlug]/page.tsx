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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Chat Container */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-6 flex flex-col">
        <div className="bg-white rounded-t-xl sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden flex-1 flex flex-col h-full">
          <ClientChatContainer 
            agent={agent}
            className="h-full flex-1"
          />
        </div>
      </div>
      {/* Footer */}
      <div className="text-center py-3 px-2 bg-white/80 border-t border-gray-200 text-xs text-gray-500 sticky bottom-0 z-10">
        Powered by Chayo AI • Tu Comadre Digital
      </div>
    </div>
  )
} 