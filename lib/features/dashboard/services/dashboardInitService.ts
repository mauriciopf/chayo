import { supabase } from '@/lib/shared/supabase/client'
import { getAgentChatLinkForOrganization } from '../../organizations/services/agentService'
import { Agent, Organization } from '@/lib/shared/types'

// Define AgentChannel type based on agent_channels table and query usage
export interface AgentChannel {
  id: string
  agent_id: string
  organization_id: string
  channel: string // e.g. 'whatsapp', 'agent_chat_link', 'web_widget'
  config?: Record<string, any> | null // channel-specific config (optional)
  created_at: string
  updated_at: string
}

export interface DashboardInitData {
  business: Organization | null
  agents: Agent[]
  businessInfoFields: {
    business_info_gathered: number
    whatsapp_trial_mentioned: boolean
  }
  agentChatLink?: AgentChannel | null
  threshold: number
}

export class DashboardInitService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  /**
   * Initialize all dashboard data on load
   */
  async initializeDashboard(locale: string = 'en'): Promise<DashboardInitData> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await this.supabaseClient.auth.getUser()
      if (authError || !user) {
        // Return default state for unauthenticated users
        return {
          agents: [],
          business: null,
          businessInfoFields: {
            business_info_gathered: 0,
            whatsapp_trial_mentioned: false
          },
          agentChatLink: null,
          threshold: 10
        }
      }
      // Fetch all data in parallel
      const [business, agents, businessInfoFields] = await Promise.all([
        this.fetchBusiness(user.id),
        this.fetchAgents(user.id),
        this.fetchBusinessInfoFields(user.id)
      ])
      // Fetch agent chat link if business exists
      let agentChatLink = null
      if (business && business.id) {
        try {
          agentChatLink = await getAgentChatLinkForOrganization(business.id)
        } catch (e) {
          agentChatLink = null
        }
      }
      return {
        business,
        agents,
        businessInfoFields,
        agentChatLink,
        threshold: 10 // Hardcoded threshold value
      }
    } catch (error) {
      console.error('❌ Error initializing dashboard:', error)
      throw new Error('Failed to initialize dashboard')
    }
  }
  private async fetchBusiness(userId: string): Promise<any> {
    try {
      const { data: organization, error } = await this.supabaseClient
        .from('organizations')
        .select('*')
        .eq('owner_id', userId)
        .single()
      if (error) {
        console.warn('No organization found for user, will create one:', error)
        return null
      }
      return organization
    } catch (error) {
      console.error('Error fetching business:', error)
      return null
    }
  }
  private async fetchAgents(userId: string): Promise<any[]> {
    try {
      const { data: organization } = await this.supabaseClient
        .from('organizations')
        .select('id')
        .eq('owner_id', userId)
        .single()
      if (!organization) {
        return []
      }
      const { data: agents, error } = await this.supabaseClient
        .from('agents')
        .select('*')
        .eq('organization_id', organization.id)
      if (error) {
        console.warn('Error fetching agents:', error)
        return []
      }
      return agents || []
    } catch (error) {
      console.error('Error fetching agents:', error)
      return []
    }
  }
  private async fetchBusinessInfoFields(userId: string): Promise<any> {
    try {
      const { data: organization } = await this.supabaseClient
        .from('organizations')
        .select('id')
        .eq('owner_id', userId)
        .single()
      if (!organization) {
        return {
          business_info_gathered: 0,
          whatsapp_trial_mentioned: false
        }
      }

      // Count answered business info fields directly
      const { data: answeredFields, error: fieldsError } = await this.supabaseClient
        .from('business_info_fields')
        .select('field_name')
        .eq('organization_id', organization.id)
        .eq('is_answered', true)

      if (fieldsError) {
        console.warn('Error fetching business info fields:', fieldsError)
        return {
          business_info_gathered: 0,
          whatsapp_trial_mentioned: false
        }
      }

      const businessInfoGathered = answeredFields?.length || 0

      return {
        business_info_gathered: businessInfoGathered,
        whatsapp_trial_mentioned: false // This could be enhanced to check for WhatsApp trial mentions
      }
    } catch (error) {
      console.error('Error fetching business info fields:', error)
      return {
        business_info_gathered: 0,
        whatsapp_trial_mentioned: false
      }
    }
  }

  async generateInitialChatMessage(business: any, locale: string): Promise<{
    content: string
    multipleChoices?: string[]
    allowMultiple?: boolean
    showOtherOption?: boolean
  }> {
    try {
      const isSpanish = locale === 'es'
      
      // Call the organization-chat route to get the proper chat message
      const response = await fetch('/api/organization-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [], // Empty messages for initial chat
          locale: locale
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get initial chat message: ${response.status}`)
      }

      const data = await response.json()
      
      // Return the AI message directly without adding a greeting
      // The API already handles the appropriate message (greeting or onboarding question)
      return {
        content: data.aiMessage,
        multipleChoices: data.multipleChoices,
        allowMultiple: data.allowMultiple,
        showOtherOption: data.showOtherOption
      }
    } catch (error) {
      console.error('Error generating initial chat message:', error)
      return {
        content: locale === 'es'
          ? '¡Hola! Soy Chayo, tu asistente de IA. ¿Cómo puedo ayudarte hoy?'
          : 'Hello! I\'m Chayo, your AI assistant. How can I help you today?'
      }
    }
  }

}

export const dashboardInitService = new DashboardInitService() 