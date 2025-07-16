import { createClient } from '@/lib/supabase/client'

export interface BusinessInfo {
  business_type?: string
  business_name?: string
  industry?: string
  products_services?: string[]
  target_customers?: string
  business_processes?: string[]
  challenges?: string[]
  business_goals?: string[]
  customer_service?: string
  pricing_strategies?: string
  marketing_methods?: string[]
  competitors?: string[]
  technology_tools?: string[]
}

interface ExtractionLog {
  field: string
  value: string
  extraction_method: string
  correction_flag: boolean
}

function isCorrection(text: string): boolean {
  return /\b(actually|not|correction|sorry|i meant|instead)\b/i.test(text)
}

function mergeArrays(existing: string[] = [], incoming: string[] = []): string[] {
  const set = new Set(existing.map(s => s.toLowerCase()))
  for (const item of incoming) {
    if (!set.has(item.toLowerCase())) set.add(item)
  }
  return Array.from(set)
}

export class BusinessInfoExtractor {
  private supabase = createClient()

  /**
   * Extract business information from conversation messages
   * Uses previous AI message as context for the current user reply
   * Also scans all user messages for business info, supports corrections, multi-field, and synonyms
   */
  extractFromMessages(messages: Array<{ role: string; content: string }>): { info: BusinessInfo, logs: ExtractionLog[] } {
    const businessInfo: BusinessInfo = {}
    const logs: ExtractionLog[] = []
    // Synonyms for each field
    const fieldPatterns: Record<string, RegExp[]> = {
      business_type: [/(type of business|what business|industry|business kind|sector)/i],
      business_name: [/(name of your business|business name|company name|what is your business called|called)/i],
      products_services: [/(products|services|offer|sell|provide|menu|items|what do you offer|what do you sell)/i],
      target_customers: [/(target customers|who are your customers|who do you serve|customer base|target market|audience)/i],
      business_processes: [/(business processes|operations|how do you operate|workflow|processes)/i],
      challenges: [/(challenges|problems|difficulties|pain points|issues)/i],
      business_goals: [/(goals|objectives|aims|targets|what do you want to achieve)/i],
      customer_service: [/(customer service|support|how do you handle customers|service approach)/i],
      pricing_strategies: [/(pricing|how do you price|pricing strategy|cost structure)/i],
      marketing_methods: [/(marketing|how do you market|advertising|promotion|promote|outreach)/i],
      competitors: [/(competitors|competition|rivals|other businesses|who else)/i],
      technology_tools: [/(technology|tools|software|platforms|apps|systems)/i],
    }
    // Go through the conversation, look for (AI question, user answer) pairs and also scan all user messages
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1]
      const curr = messages[i]
      if (curr.role !== 'user') continue
      const answer = curr.content.trim()
      const question = prev && prev.role === 'assistant' ? prev.content.toLowerCase() : ''
      const correction = isCorrection(answer)
      // Try to extract based on context (AI question)
      for (const [field, patterns] of Object.entries(fieldPatterns)) {
        if (patterns.some(p => question.match(p))) {
          // Multi-value fields
          if (["products_services","business_processes","challenges","business_goals","marketing_methods","competitors","technology_tools"].includes(field)) {
            const values = answer.split(/[,&\n]/).map(s => s.trim()).filter(Boolean)
            if (values.length > 0) {
              (businessInfo as any)[field] = mergeArrays((businessInfo as any)[field] as string[] || [], values)
              logs.push({ field, value: values.join(", "), extraction_method: 'contextual', correction_flag: correction })
            }
          } else {
            if (answer.length > 1) {
              (businessInfo as any)[field] = answer
              logs.push({ field, value: answer, extraction_method: 'contextual', correction_flag: correction })
            }
          }
        }
      }
      // Also scan the user answer for direct info (regex, fallback)
      for (const [field, patterns] of Object.entries(fieldPatterns)) {
        if (["products_services","business_processes","challenges","business_goals","marketing_methods","competitors","technology_tools"].includes(field)) {
          // Look for comma/and-separated lists
          const match = answer.match(new RegExp(`(?:my|our|the)? ?${field.replace('_', ' ')}[\s:]*([\w\s,&-]+)`, 'i'))
          if (match) {
            const values = match[1].split(/[,&\n]/).map(s => s.trim()).filter(Boolean)
            if (values.length > 0) {
              (businessInfo as any)[field] = mergeArrays((businessInfo as any)[field] as string[] || [], values)
              logs.push({ field, value: values.join(", "), extraction_method: 'regex', correction_flag: correction })
            }
          }
        } else {
          for (const pat of patterns) {
            if (pat.test(answer)) {
              (businessInfo as any)[field] = answer
              logs.push({ field, value: answer, extraction_method: 'regex', correction_flag: correction })
            }
          }
        }
      }
    }
    return { info: businessInfo, logs }
  }

  async updateAgentBusinessConstraints(agentId: string, userId: string, businessInfo: BusinessInfo, logs: ExtractionLog[]): Promise<void> {
    try {
      const { data: agent, error: agentError } = await this.supabase
        .from('agents')
        .select('business_constraints')
        .eq('id', agentId)
        .single()
      if (agentError || !agent) throw new Error('Agent not found')
      const currentConstraints = agent.business_constraints || {}
      // Merge/append logic for arrays, update only if more specific or correction
      const updatedConstraints = { ...currentConstraints }
      for (const [field, value] of Object.entries(businessInfo)) {
        if (Array.isArray(value)) {
          (updatedConstraints as any)[field] = mergeArrays((currentConstraints as any)[field] || [], value)
        } else if (typeof value === 'string') {
          if (!(currentConstraints as any)[field] || value.length > ((currentConstraints as any)[field]?.length || 0)) {
            (updatedConstraints as any)[field] = value
          }
        }
      }
      updatedConstraints.business_info_gathered = (currentConstraints.business_info_gathered || 0) + 1
      // Also update name/industry for convenience
      if (businessInfo.business_name) updatedConstraints.name = businessInfo.business_name
      if (businessInfo.business_type) updatedConstraints.industry = businessInfo.business_type
      // Update agent
      const { error: updateError } = await this.supabase
        .from('agents')
        .update({ business_constraints: updatedConstraints })
        .eq('id', agentId)
      if (updateError) throw new Error('Failed to update agent business constraints')
      // Log all extracted info to business_info_history
      for (const log of logs) {
        await this.supabase.from('business_info_history').insert({
          agent_id: agentId,
          user_id: userId,
          field: log.field,
          value: log.value,
          extraction_method: log.extraction_method,
          correction_flag: log.correction_flag
        })
      }
      console.log('Updated agent business constraints:', updatedConstraints)
    } catch (error) {
      console.error('Error updating agent business constraints:', error)
      throw error
    }
  }

  async processConversationForBusinessInfo(
    agentId: string,
    userId: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<BusinessInfo> {
    try {
      const { info: businessInfo, logs } = this.extractFromMessages(messages)
      console.log('Extracted business info:', businessInfo)
      if (Object.keys(businessInfo).length > 0) {
        await this.updateAgentBusinessConstraints(agentId, userId, businessInfo, logs)
        console.log('Updated agent business constraints with:', businessInfo)
      } else {
        console.log('No new business info extracted from messages')
      }
      return businessInfo
    } catch (error) {
      console.error('Error processing conversation for business info:', error)
      return {}
    }
  }
}

export const businessInfoExtractor = new BusinessInfoExtractor() 