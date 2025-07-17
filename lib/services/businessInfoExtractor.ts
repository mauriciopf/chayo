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
   * LLM-based validation: checks if the user's answer is a valid response to the AI's question
   */
  async isValidBusinessAnswerLLM(question: string, answer: string): Promise<boolean> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OpenAI API key not set')
    const prompt = `You are validating user input for a business onboarding chatbot.\nQuestion: "${question}"\nUser reply: "${answer}"\nIs this a valid, specific answer to the question? Reply only "yes" or "no".`
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3,
        temperature: 0
      })
    })
    if (!res.ok) {
      console.error('OpenAI validation error:', await res.text())
      return false
    }
    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content?.trim().toLowerCase() || ''
    const valid = reply.startsWith('yes')
    console.log(`[LLM Validation] Q: ${question} | A: ${answer} | Valid: ${valid}`)
    return valid
  }

  /**
   * Extract business information from conversation messages with LLM validation
   */
  async extractFromMessagesValidated(messages: Array<{ role: string; content: string }>): Promise<{ info: BusinessInfo, logs: ExtractionLog[] }> {
    const businessInfo: BusinessInfo = {}
    const logs: ExtractionLog[] = []
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
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1]
      const curr = messages[i]
      if (curr.role !== 'user') continue
      const answer = curr.content.trim()
      const question = prev && prev.role === 'assistant' ? prev.content.toLowerCase() : ''
      const correction = isCorrection(answer)
      for (const [field, patterns] of Object.entries(fieldPatterns)) {
        if (patterns.some(p => question.match(p))) {
          // Multi-value fields
          if (["products_services","business_processes","challenges","business_goals","marketing_methods","competitors","technology_tools"].includes(field)) {
            const values = answer.split(/[,&\n]/).map(s => s.trim()).filter(Boolean)
            if (values.length > 0) {
              // Validate each value (or the whole answer)
              if (await this.isValidBusinessAnswerLLM(question, answer)) {
                (businessInfo as any)[field] = mergeArrays((businessInfo as any)[field] as string[] || [], values)
                logs.push({ field, value: values.join(", "), extraction_method: 'contextual', correction_flag: correction })
              }
            }
          } else {
            if (answer.length > 1) {
              if (await this.isValidBusinessAnswerLLM(question, answer)) {
                (businessInfo as any)[field] = answer
                logs.push({ field, value: answer, extraction_method: 'contextual', correction_flag: correction })
              }
            }
          }
          // Add a short delay to avoid rate limits
          await new Promise(res => setTimeout(res, 200))
        }
      }
      // Also scan the user answer for direct info (regex, fallback)
      for (const [field, patterns] of Object.entries(fieldPatterns)) {
        if (["products_services","business_processes","challenges","business_goals","marketing_methods","competitors","technology_tools"].includes(field)) {
          const match = answer.match(new RegExp(`(?:my|our|the)? ?${field.replace('_', ' ')}[\s:]*([\w\s,&-]+)`, 'i'))
          if (match) {
            const values = match[1].split(/[,&\n]/).map(s => s.trim()).filter(Boolean)
            if (values.length > 0) {
              if (await this.isValidBusinessAnswerLLM(field.replace('_', ' '), match[1])) {
                (businessInfo as any)[field] = mergeArrays((businessInfo as any)[field] as string[] || [], values)
                logs.push({ field, value: values.join(", "), extraction_method: 'regex', correction_flag: correction })
              }
            }
          }
        } else {
          for (const pat of patterns) {
            if (pat.test(answer)) {
              if (await this.isValidBusinessAnswerLLM(field.replace('_', ' '), answer)) {
                (businessInfo as any)[field] = answer
                logs.push({ field, value: answer, extraction_method: 'regex', correction_flag: correction })
              }
            }
          }
        }
        await new Promise(res => setTimeout(res, 200))
      }
    }
    return { info: businessInfo, logs }
  }

  async updateAgentBusinessConstraints(agentId: string, userId: string, businessInfo: BusinessInfo, logs: ExtractionLog[]): Promise<void> {
    try {
      const { data: agent, error: agentError } = await this.supabase
        .from('agents')
        .select('business_constraints, organization_id, name')
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
      
      // Update agent with new business constraints and name
      const agentUpdateData: any = { business_constraints: updatedConstraints }
      if (businessInfo.business_name) {
        agentUpdateData.name = businessInfo.business_name
      }
      
      const { error: updateError } = await this.supabase
        .from('agents')
        .update(agentUpdateData)
        .eq('id', agentId)
      if (updateError) throw new Error('Failed to update agent business constraints')

      // If business name was extracted, update the organization name too
      if (businessInfo.business_name && agent.organization_id) {
        const { error: orgUpdateError } = await this.supabase
          .from('organizations')
          .update({ name: businessInfo.business_name })
          .eq('id', agent.organization_id)
          .eq('owner_id', userId) // Only update if user owns the organization
        
        if (orgUpdateError) {
          console.warn('Failed to update organization name:', orgUpdateError)
          // Don't throw error - this is not critical
        } else {
          console.log('Updated organization name to:', businessInfo.business_name)
        }
      }
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
      const { info: businessInfo, logs } = await this.extractFromMessagesValidated(messages)
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