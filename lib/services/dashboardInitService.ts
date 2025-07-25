import { supabase } from '@/lib/supabase/client'
import { getAgentChatLinkForOrganization, agentService } from './agentService'
import { Agent, Organization } from '@/components/dashboard/types'

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
        threshold: agentService.getThreshold()
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
        return null
      }
      return {
        business_info_gathered: 0,
        whatsapp_trial_mentioned: false
      }
    } catch (error) {
      console.error('Error fetching business info fields:', error)
      return {
        business_info_gathered: 0,
        whatsapp_trial_mentioned: false
      }
    }
  }
  private async ensureInitialBusinessInfoRequirements(organizationId: string, locale: string) {
    try {
      console.log('Ensuring business info requirements for organization:', organizationId)
      const response = await fetch('/api/business-info-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          locale
        })
      })
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to initialize business info fields:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
      } else {
        console.log('Successfully initialized business info fields')
      }
    } catch (error) {
      console.error('Error ensuring initial business info requirements:', error)
    }
  }
  async generateInitialChatMessage(business: any, locale: string): Promise<string> {
    try {
      const isSpanish = locale === 'es'
      await this.ensureInitialBusinessInfoRequirements(business.id, locale)
      try {
        const { BusinessInfoService } = await import('./businessInfoService')
        const businessInfoService = new BusinessInfoService()
        let pendingQuestions = await businessInfoService.getPendingQuestions(business.id)
        if (pendingQuestions && pendingQuestions.length > 0) {
          const firstQuestion = pendingQuestions[0].question_template
          const greeting = isSpanish
            ? '¡Hola! Soy Chayo, tu asistente de IA. Continuemos configurando tu negocio. '
            : 'Hello! I\'m Chayo, your AI assistant. Let\'s continue setting up your business. '
          return greeting + firstQuestion
        }
        console.log('🔄 No pending questions found, generating dynamic questions for new user')
        try {
          const response = await fetch('/api/generate-business-questions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              organizationId: business.id,
              conversation: ''
            })
          })
          if (response.ok) {
            const { questions } = await response.json()
            if (questions && questions.length > 0) {
              const firstQuestion = questions[0].question_template
              const greeting = isSpanish
                ? '¡Hola! Soy Chayo, tu asistente de IA. Empecemos configurando tu negocio. '
                : 'Hello! I\'m Chayo, your AI assistant. Let\'s start setting up your business. '
              return greeting + firstQuestion
            }
          } else {
            const errorData = await response.json()
            console.error('Failed to generate business questions:', errorData)
          }
        } catch (error) {
          console.error('Error calling generate business questions API:', error)
        }
        return isSpanish
          ? '¡Hola! Soy Chayo. Ya tienes tu información de negocio completa. Ahora enfoquémonos en cómo quieres que Chayo se comunique con tus clientes. ¿Qué tono prefieres que use Chayo al hablar con tus clientes?'
          : 'Hello! I\'m Chayo. Your business information is complete. Now let\'s focus on how you want Chayo to communicate with your clients. What tone would you prefer Chayo to use when speaking with your customers?'
      } catch (error) {
        console.error('Error fetching pending questions:', error)
        return isSpanish
          ? '¡Hola! Soy Chayo. Continuemos configurando tu asistente de IA para tu negocio.'
          : 'Hello! I\'m Chayo. Let\'s continue setting up your AI assistant for your business.'
      }
    } catch (error) {
      console.error('Error generating initial chat message:', error)
      return locale === 'es'
        ? '¡Hola! Soy Chayo, tu asistente de IA. ¿Cómo puedo ayudarte hoy?'
        : 'Hello! I\'m Chayo, your AI assistant. How can I help you today?'
    }
  }
  async autoStartChat(initialMessage: string, locale: string): Promise<string | null> {
    try {
      const { data: { user }, error: authError } = await this.supabaseClient.auth.getUser()
      if (authError || !user) {
        return locale === 'es'
          ? '¡Hola! Soy Chayo, tu asistente de IA. Comienza a chatear conmigo para configurar tu negocio.'
          : 'Hello! I\'m Chayo, your AI assistant. Start chatting with me to set up your business.'
      }
      const business = await this.fetchBusiness(user.id)
      if (business) {
        return await this.generateInitialChatMessage(business, locale)
      } else {
        return locale === 'es'
          ? '¡Hola! Soy Chayo. Vamos a configurar tu negocio. ¿Cuál es el nombre de tu empresa?'
          : 'Hello! I\'m Chayo. Let\'s set up your business. What\'s your company name?'
      }
    } catch (error) {
      console.error('Error auto-starting chat:', error)
      return null
    }
  }
}

export const dashboardInitService = new DashboardInitService() 