import { supabase } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'
import { getAgentChatLinkForOrganization } from './agentService'
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
}

export class DashboardInitService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || supabase
  }

  /**
   * Initialize all dashboard data on load
   */
  async initializeDashboard(locale: string = 'en'): Promise<DashboardInitData> {
    try {

      
      // Get current user
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      if (authError || !user) {
        // Return default state for unauthenticated users
        return {
          agents: [],
          business: null,
          businessInfoFields: {
            business_info_gathered: 0,
            whatsapp_trial_mentioned: false
          },
          agentChatLink: null
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
          agentChatLink = await getAgentChatLinkForOrganization(this.supabase, business.id)
        } catch (e) {
          agentChatLink = null
        }
      }

      return {
        business,
        agents,
        businessInfoFields,
        agentChatLink
      }
    } catch (error) {
      console.error('❌ Error initializing dashboard:', error)
      throw new Error('Failed to initialize dashboard')
    }
  }

  /**
   * Fetch business/organization data
   */
  private async fetchBusiness(userId: string): Promise<any> {
    try {
      const { data: organization, error } = await this.supabase
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

  /**
   * Fetch agents for the user
   */
  private async fetchAgents(userId: string): Promise<any[]> {
    try {
      // First get the organization
      const { data: organization } = await this.supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', userId)
        .single()

      if (!organization) {
        return []
      }

      // Get agents for this organization
      const { data: agents, error } = await this.supabase
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

  /**
   * Fetch business info fields from business_constraints_view
   */
  private async fetchBusinessInfoFields(userId: string): Promise<any> {
    try {
      // First get the organization
      const { data: organization } = await this.supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', userId)
        .single()

      if (!organization) {
        return null
      }

      // For new users, return default state instead of querying the view
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

  /**
   * Ensure initial business info requirements (e.g., business_name question) are present for the organization
   */
  private async ensureInitialBusinessInfoRequirements(organizationId: string, locale: string) {
    try {
      console.log('Ensuring business info requirements for organization:', organizationId)
      
      // Use the server-side API route to avoid RLS policy violations
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

  /**
   * Generate appropriate initial chat message by fetching first question
   */
  async generateInitialChatMessage(business: any, locale: string): Promise<string> {
    try {
      const isSpanish = locale === 'es'


      // Business exists - ensure initial requirements (e.g., business_name question)
      await this.ensureInitialBusinessInfoRequirements(business.id, locale)

      // Business exists - fetch the next appropriate question
      try {
        const { BusinessInfoService } = await import('./businessInfoService')
        const businessInfoService = new BusinessInfoService(this.supabase)
        
        // Get pending questions for this organization
        let pendingQuestions = await businessInfoService.getPendingQuestions(business.id)
        
        if (pendingQuestions && pendingQuestions.length > 0) {
          // Return the first pending question as the initial message
          const firstQuestion = pendingQuestions[0].question_template
          
          const greeting = isSpanish
            ? '¡Hola! Soy Chayo, tu asistente de IA. Continuemos configurando tu negocio. '
            : 'Hello! I\'m Chayo, your AI assistant. Let\'s continue setting up your business. '
          
          return greeting + firstQuestion
        }
        
        // If no pending questions, generate dynamic questions for new users
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
        
        // If no questions could be generated, business info is complete - focus on client communication
        return isSpanish
          ? '¡Hola! Soy Chayo. Ya tienes tu información de negocio completa. Ahora enfoquémonos en cómo quieres que Chayo se comunique con tus clientes. ¿Qué tono prefieres que use Chayo al hablar con tus clientes?'
          : 'Hello! I\'m Chayo. Your business information is complete. Now let\'s focus on how you want Chayo to communicate with your clients. What tone would you prefer Chayo to use when speaking with your customers?'
        
      } catch (error) {
        console.error('Error fetching pending questions:', error)
        
        // Fallback to basic continuation message
        return isSpanish
          ? '¡Hola! Soy Chayo. Continuemos configurando tu asistente de IA para tu negocio.'
          : 'Hello! I\'m Chayo. Let\'s continue setting up your AI assistant for your business.'
      }
    } catch (error) {
      console.error('Error generating initial chat message:', error)
      
      // Fallback message
      return locale === 'es'
        ? '¡Hola! Soy Chayo, tu asistente de IA. ¿Cómo puedo ayudarte hoy?'
        : 'Hello! I\'m Chayo, your AI assistant. How can I help you today?'
    }
  }

  /**
   * Auto-start chat conversation by generating an initial AI message
   */
  async autoStartChat(initialMessage: string, locale: string): Promise<string | null> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      if (authError || !user) {
        // For unauthenticated users, return a generic welcome message
        return locale === 'es'
          ? '¡Hola! Soy Chayo, tu asistente de IA. Comienza a chatear conmigo para configurar tu negocio.'
          : 'Hello! I\'m Chayo, your AI assistant. Start chatting with me to set up your business.'
      }

      // For authenticated users, generate a personalized initial message
      const business = await this.fetchBusiness(user.id)
      if (business) {
        return await this.generateInitialChatMessage(business, locale)
      } else {
        // No business yet - return a setup message
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

// Export singleton instance
export const dashboardInitService = new DashboardInitService() 