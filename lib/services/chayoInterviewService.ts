import { createClient } from '@/lib/supabase/client'
import { embeddingService } from './embeddingService'
import { systemPromptService } from './systemPromptService'

export interface BusinessInterviewQuestion {
  id: string
  category: 'business_basics' | 'policies' | 'customer_service' | 'products' | 'values' | 'procedures' | 'integration'
  question: string
  followUpQuestions?: string[]
  importance: 'high' | 'medium' | 'low'
  expectedResponseType: 'text' | 'list' | 'example' | 'policy'
}

export interface InterviewSession {
  id: string
  agentId: string
  userId: string
  status: 'active' | 'completed' | 'paused'
  currentQuestionIndex: number
  responses: BusinessResponse[]
  startedAt: Date
  completedAt?: Date
}

export interface BusinessResponse {
  questionId: string
  question: string
  response: string
  category: string
  timestamp: Date
  metadata?: Record<string, any>
}

export class ChayoInterviewService {
  private supabase = createClient()

  // Predefined interview questions for Chayo to ask
  private interviewQuestions: BusinessInterviewQuestion[] = [
    // Business Basics
    {
      id: 'business_name',
      category: 'business_basics',
      question: 'What is the name of your business?',
      importance: 'high',
      expectedResponseType: 'text'
    },
    {
      id: 'business_description',
      category: 'business_basics',
      question: 'Can you describe what your business does? What products or services do you offer?',
      importance: 'high',
      expectedResponseType: 'text',
      followUpQuestions: [
        'Who are your main customers?',
        'What makes your business unique?'
      ]
    },
    {
      id: 'business_hours',
      category: 'business_basics',
      question: 'What are your business hours? When are you open and closed?',
      importance: 'high',
      expectedResponseType: 'text'
    },
    {
      id: 'contact_info',
      category: 'business_basics',
      question: 'What contact information should customers use? (phone, email, address)',
      importance: 'high',
      expectedResponseType: 'text'
    },

    // Business Values & Tone
    {
      id: 'communication_tone',
      category: 'values',
      question: 'How would you like your business to communicate with customers? (formal, friendly, professional, casual, etc.)',
      importance: 'high',
      expectedResponseType: 'text'
    },
    {
      id: 'business_values',
      category: 'values',
      question: 'What are the core values of your business? What principles guide your decisions?',
      importance: 'medium',
      expectedResponseType: 'list',
      followUpQuestions: [
        'How do these values affect how you treat customers?',
        'What do you want customers to feel when they interact with your business?'
      ]
    },

    // Policies & Procedures
    {
      id: 'payment_methods',
      category: 'policies',
      question: 'What payment methods do you accept?',
      importance: 'high',
      expectedResponseType: 'list'
    },
    {
      id: 'shipping_policy',
      category: 'policies',
      question: 'What is your shipping policy? Do you offer free shipping?',
      importance: 'medium',
      expectedResponseType: 'policy',
      followUpQuestions: [
        'How long does shipping typically take?',
        'Do you ship internationally?'
      ]
    },
    {
      id: 'return_policy',
      category: 'policies',
      question: 'What is your return and refund policy?',
      importance: 'medium',
      expectedResponseType: 'policy'
    },
    {
      id: 'warranty_policy',
      category: 'policies',
      question: 'Do you offer any warranties or guarantees on your products/services?',
      importance: 'medium',
      expectedResponseType: 'policy'
    },

    // Customer Service
    {
      id: 'common_questions',
      category: 'customer_service',
      question: 'What are the most common questions customers ask you?',
      importance: 'high',
      expectedResponseType: 'list',
      followUpQuestions: [
        'How do you typically answer these questions?',
        'Are there any questions that customers often have trouble understanding?'
      ]
    },
    {
      id: 'customer_issues',
      category: 'customer_service',
      question: 'What are the most common problems or complaints customers have?',
      importance: 'high',
      expectedResponseType: 'list',
      followUpQuestions: [
        'How do you typically resolve these issues?',
        'What steps do you take to prevent these problems?'
      ]
    },
    {
      id: 'escalation_process',
      category: 'customer_service',
      question: 'When a customer has a complex issue, what is your process for handling it?',
      importance: 'medium',
      expectedResponseType: 'text'
    },

    // Products & Services
    {
      id: 'product_categories',
      category: 'products',
      question: 'What categories of products or services do you offer?',
      importance: 'high',
      expectedResponseType: 'list'
    },
    {
      id: 'pricing_info',
      category: 'products',
      question: 'How do you handle pricing? Do you have different tiers or packages?',
      importance: 'medium',
      expectedResponseType: 'text'
    },
    {
      id: 'special_offers',
      category: 'products',
      question: 'Do you offer any special deals, discounts, or promotions?',
      importance: 'medium',
      expectedResponseType: 'text'
    },

    // Procedures
    {
      id: 'order_process',
      category: 'procedures',
      question: 'What is the typical process for customers to place an order or book a service?',
      importance: 'high',
      expectedResponseType: 'text'
    },
    {
      id: 'delivery_process',
      category: 'procedures',
      question: 'How do you handle delivery or service completion?',
      importance: 'medium',
      expectedResponseType: 'text'
    },

    // WhatsApp Integration
    {
      id: 'whatsapp_preference',
      category: 'integration',
      question: 'Would you like to connect your business to WhatsApp? This will allow customers to message your business directly.',
      importance: 'high',
      expectedResponseType: 'text',
      followUpQuestions: [
        'Do you have an existing WhatsApp Business number?',
        'Would you prefer a new WhatsApp number for your business?'
      ]
    },
    {
      id: 'whatsapp_number',
      category: 'integration',
      question: 'What WhatsApp number would you like to use for your business? (Please provide the number with country code, e.g., +1234567890)',
      importance: 'high',
      expectedResponseType: 'text'
    },
    {
      id: 'whatsapp_greeting',
      category: 'integration',
      question: 'What greeting message should customers see when they first message your business on WhatsApp?',
      importance: 'medium',
      expectedResponseType: 'text'
    }
  ]

  /**
   * Start a new interview session with a business owner
   */
  async startInterview(agentId: string, userId: string): Promise<InterviewSession> {
    try {
      const session: InterviewSession = {
        id: `interview-${Date.now()}`,
        agentId,
        userId,
        status: 'active',
        currentQuestionIndex: 0,
        responses: [],
        startedAt: new Date()
      }

      // Store session in database
      const { error } = await this.supabase
        .from('interview_sessions')
        .insert(session)

      if (error) {
        console.error('Error creating interview session:', error)
        throw new Error('Failed to start interview session')
      }

      return session
    } catch (error) {
      console.error('Error in startInterview:', error)
      throw error
    }
  }

  /**
   * Get the next question for Chayo to ask
   */
  getNextQuestion(session: InterviewSession): BusinessInterviewQuestion | null {
    if (session.currentQuestionIndex >= this.interviewQuestions.length) {
      return null // Interview complete
    }

    return this.interviewQuestions[session.currentQuestionIndex]
  }

  /**
   * Record a business owner's response
   */
  async recordResponse(
    sessionId: string,
    questionId: string,
    response: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const question = this.interviewQuestions.find(q => q.id === questionId)
      if (!question) {
        throw new Error('Question not found')
      }

      const businessResponse: BusinessResponse = {
        questionId,
        question: question.question,
        response,
        category: question.category,
        timestamp: new Date(),
        metadata
      }

      // Add to session responses
      await this.supabase
        .from('interview_responses')
        .insert({
          session_id: sessionId,
          ...businessResponse
        })

      // Update session progress
      await this.supabase
        .from('interview_sessions')
        .update({ 
          current_question_index: this.interviewQuestions.findIndex(q => q.id === questionId) + 1
        })
        .eq('id', sessionId)

    } catch (error) {
      console.error('Error recording response:', error)
      throw error
    }
  }

  /**
   * Generate follow-up questions based on the response
   */
  generateFollowUpQuestions(question: BusinessInterviewQuestion, response: string): string[] {
    if (!question.followUpQuestions) {
      return []
    }

    // Simple logic to determine which follow-ups to ask
    // In a real implementation, you might use AI to generate contextual follow-ups
    return question.followUpQuestions.slice(0, 2) // Limit to 2 follow-ups
  }

  /**
   * Complete the interview and process all responses into embeddings
   */
  async completeInterview(sessionId: string): Promise<{ whatsappSetup?: any }> {
    try {
      // Get all responses from the session
      const { data: responses, error } = await this.supabase
        .from('interview_responses')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })

      if (error || !responses) {
        throw new Error('Failed to fetch interview responses')
      }

      // Get session info
      const { data: session } = await this.supabase
        .from('interview_sessions')
        .select('agent_id')
        .eq('id', sessionId)
        .single()

      if (!session) {
        throw new Error('Session not found')
      }

      // Convert responses to conversation segments
      const conversationSegments = responses.map(response => ({
        text: `Q: ${response.question}\nA: ${response.response}`,
        type: 'conversation' as const,
        metadata: {
          category: response.category,
          source: 'chayo_interview',
          sessionId,
          timestamp: response.timestamp
        }
      }))

      // Add business knowledge segments
      const knowledgeSegments = this.extractBusinessKnowledge(responses)
      conversationSegments.push(...knowledgeSegments)

      // Store in embeddings
      await embeddingService.storeConversationEmbeddings(
        session.agent_id,
        conversationSegments
      )

      // Update system prompt
      await systemPromptService.updateAgentSystemPrompt(session.agent_id)

      // Check if WhatsApp setup is needed
      const whatsappResponse = responses.find(r => r.question_id === 'whatsapp_preference')
      const whatsappNumberResponse = responses.find(r => r.question_id === 'whatsapp_number')
      
      let whatsappSetup = null
      if (whatsappResponse && whatsappResponse.response.toLowerCase().includes('yes')) {
        whatsappSetup = {
          needsSetup: true,
          phoneNumber: whatsappNumberResponse?.response || null,
          greeting: responses.find(r => r.question_id === 'whatsapp_greeting')?.response || null
        }
      }

      // Mark session as completed
      await this.supabase
        .from('interview_sessions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      return { whatsappSetup }

    } catch (error) {
      console.error('Error completing interview:', error)
      throw error
    }
  }

  /**
   * Extract business knowledge from interview responses
   */
  private extractBusinessKnowledge(responses: any[]): any[] {
    const knowledgeSegments = []

    for (const response of responses) {
      // Extract business policies
      if (response.category === 'policies') {
        knowledgeSegments.push({
          text: response.response,
          type: 'knowledge' as const,
          metadata: {
            category: response.category,
            source: 'chayo_interview',
            questionId: response.question_id
          }
        })
      }

      // Extract FAQs
      if (response.category === 'customer_service' && response.question.includes('common questions')) {
        // Parse the response to extract individual questions
        const questions = this.parseQuestionsFromResponse(response.response)
        questions.forEach(question => {
          knowledgeSegments.push({
            text: question,
            type: 'faq' as const,
            metadata: {
              source: 'chayo_interview',
              questionId: response.question_id
            }
          })
        })
      }

      // Extract business values
      if (response.category === 'values') {
        knowledgeSegments.push({
          text: response.response,
          type: 'knowledge' as const,
          metadata: {
            category: 'values',
            source: 'chayo_interview',
            questionId: response.question_id
          }
        })
      }
    }

    return knowledgeSegments
  }

  /**
   * Parse questions from a response about common questions
   */
  private parseQuestionsFromResponse(response: string): string[] {
    // Simple parsing - split by common delimiters
    const questions = response
      .split(/[•\-\*\n]/)
      .map(q => q.trim())
      .filter(q => q.length > 0 && q.includes('?'))
      .slice(0, 5) // Limit to 5 questions

    return questions
  }

  /**
   * Get interview progress
   */
  async getInterviewProgress(sessionId: string): Promise<{
    totalQuestions: number
    completedQuestions: number
    progress: number
    currentQuestion?: BusinessInterviewQuestion
  }> {
    try {
      const { data: session } = await this.supabase
        .from('interview_sessions')
        .select('current_question_index, status')
        .eq('id', sessionId)
        .single()

      if (!session) {
        throw new Error('Session not found')
      }

      const totalQuestions = this.interviewQuestions.length
      const completedQuestions = session.current_question_index
      const progress = (completedQuestions / totalQuestions) * 100

      let currentQuestion: BusinessInterviewQuestion | undefined
      if (session.status === 'active' && completedQuestions < totalQuestions) {
        currentQuestion = this.interviewQuestions[completedQuestions]
      }

      return {
        totalQuestions,
        completedQuestions,
        progress,
        currentQuestion
      }
    } catch (error) {
      console.error('Error getting interview progress:', error)
      throw error
    }
  }
}

// Export singleton instance
export const chayoInterviewService = new ChayoInterviewService() 