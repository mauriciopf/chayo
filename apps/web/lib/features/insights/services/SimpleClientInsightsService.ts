import { supabase } from '@/lib/shared/supabase/client'
import { openAIService } from '@/lib/shared/services/OpenAIService'

export interface ClientInsight {
  id: string
  organization_id: string
  conversation_text: string
  intent: 'booking' | 'pricing' | 'support' | 'complaint' | 'other'
  conversation_date: string
  conversation_hour?: number
  created_at: string
}

export interface WeeklySummary {
  topRequest: {
    intent: string
    count: number
    percentage: number
  } | null
  allRequests: Array<{
    intent: string
    count: number
    percentage: number
  }>
  totalConversations: number
}

export class SimpleClientInsightsService {
  private supabaseClient: any

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient || supabase
  }

  /**
   * Analyze what the customer is asking for using AI
   */
  async extractIntent(conversationText: string): Promise<string> {
    try {
  

      const prompt = `Analyze this customer message and return ONLY ONE WORD for what they want:

Customer: "${conversationText}"

Return only one of these words: booking, pricing, support, complaint, other

Rules:
- booking: customer wants to schedule/book a reservation or service
- pricing: customer asking about costs, rates, prices, fees
- support: customer needs help with existing service or general questions
- complaint: customer is unhappy or reporting a problem
- other: anything else

Answer:`

      const aiResponse = await openAIService.callCompletion([
        { role: 'user', content: prompt }
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.1,
        maxTokens: 5
      })
      
      const intent = aiResponse.trim().toLowerCase() || 'other'
      
      // Validate response
      const validIntents = ['booking', 'pricing', 'support', 'complaint', 'other']
      return validIntents.includes(intent) ? intent : 'other'
      
    } catch (error) {
      console.warn('Failed to extract intent:', error)
      return 'other' // Fallback
    }
  }

  /**
   * Record a client conversation for insights
   */
  async recordConversation(
    organizationId: string,
    conversationText: string,
    conversationType: 'client' // Future: could be 'business' if we expand
  ): Promise<ClientInsight | null> {
    try {
      // Only process client conversations
      if (conversationType !== 'client') {
        return null
      }

      // Skip very short messages (likely not meaningful)
      if (conversationText.trim().length < 10) {
        return null
      }

      // Extract intent using AI
      const intent = await this.extractIntent(conversationText)
      
      // Get current hour for temporal analysis
      const now = new Date()
      const conversationHour = now.getHours()

      // Store in database
      const { data, error } = await this.supabaseClient
        .from('client_insights')
        .insert({
          organization_id: organizationId,
          conversation_text: conversationText,
          intent,
          conversation_hour: conversationHour
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to store client insight:', error)
        return null
      }

      console.log('📊 Stored client insight:', { intent, organizationId })
      return data

    } catch (error) {
      console.error('Error recording client conversation:', error)
      return null
    }
  }

  /**
   * Get simple weekly summary for dashboard
   */
  async getWeeklySummary(organizationId: string): Promise<WeeklySummary> {
    try {
      const { data, error } = await this.supabaseClient
        .from('client_insights')
        .select('intent')
        .eq('organization_id', organizationId)
        .gte('conversation_date', this.getWeekAgo())
        
      if (error) {
        console.error('Failed to get weekly summary:', error)
        return this.getEmptySummary()
      }

      if (!data || data.length === 0) {
        return this.getEmptySummary()
      }

      // Calculate intent distribution
      const intentCounts = data.reduce((acc: Record<string, number>, row: { intent: string }) => {
        acc[row.intent] = (acc[row.intent] || 0) + 1
        return acc
      }, {})

      const totalConversations = data.length
      const allRequests = Object.entries(intentCounts)
        .map(([intent, count]) => ({
          intent,
          count: count as number,
          percentage: Math.round(((count as number) / totalConversations) * 100)
        }))
        .sort((a, b) => b.count - a.count)

      return {
        topRequest: allRequests[0] || null,
        allRequests,
        totalConversations
      }

    } catch (error) {
      console.error('Error getting weekly summary:', error)
      return this.getEmptySummary()
    }
  }

  /**
   * Get insights for the last 30 days (for trends)
   */
  async getMonthlyTrends(organizationId: string): Promise<{
    dailyCounts: Array<{ date: string; count: number }>
    intentTrends: Array<{ intent: string; percentage: number }>
  }> {
    try {
      const { data, error } = await this.supabaseClient
        .from('client_insights')
        .select('intent, conversation_date')
        .eq('organization_id', organizationId)
        .gte('conversation_date', this.getMonthAgo())
        .order('conversation_date', { ascending: true })
        
      if (error || !data) {
        return { dailyCounts: [], intentTrends: [] }
      }

      // Daily counts
      const dailyCounts = data.reduce((acc: Record<string, number>, row: { conversation_date: string }) => {
        const date = row.conversation_date
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {})

      const dailyCountsArray = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count: count as number }))

      // Intent trends
      const intentCounts = data.reduce((acc: Record<string, number>, row: { intent: string }) => {
        acc[row.intent] = (acc[row.intent] || 0) + 1
        return acc
      }, {})

      const totalConversations = data.length
      const intentTrends = Object.entries(intentCounts)
        .map(([intent, count]) => ({
          intent,
          percentage: Math.round(((count as number) / totalConversations) * 100)
        }))
        .sort((a, b) => b.percentage - a.percentage)

      return {
        dailyCounts: dailyCountsArray,
        intentTrends
      }

    } catch (error) {
      console.error('Error getting monthly trends:', error)
      return { dailyCounts: [], intentTrends: [] }
    }
  }

  /**
   * Helper methods
   */
  private getWeekAgo(): string {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString().split('T')[0] // YYYY-MM-DD format
  }

  private getMonthAgo(): string {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0] // YYYY-MM-DD format
  }

  private getEmptySummary(): WeeklySummary {
    return {
      topRequest: null,
      allRequests: [],
      totalConversations: 0
    }
  }
}

// Export singleton instance
export const simpleClientInsightsService = new SimpleClientInsightsService()