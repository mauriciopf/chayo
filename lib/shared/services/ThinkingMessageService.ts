export type ThinkingContext = 
  | 'onboarding_stage_1' 
  | 'onboarding_stage_2' 
  | 'onboarding_stage_3' 
  | 'default'
  | 'business_name'
  | 'business_type' 
  | 'business_hours'
  | 'contact_preferences'
  | 'industry_analysis'
  | 'service_details'
  | 'customer_workflow'
  | 'setup_finalization'

export interface OnboardingProgressData {
  totalQuestions: number
  answeredQuestions: number
  currentStage: string
  progressPercentage: number
  isCompleted: boolean
  currentQuestion?: string
  stage1Completed: boolean
  stage2Completed: boolean
  stage3Completed: boolean
}

interface MessageStream {
  start: () => void
  stop: () => void
  getCurrentMessage: () => string
  getAllMessages: () => string[]
  getCurrentIndex: () => number
  onMessageChange: (callback: (message: string, index: number, total: number) => void) => void
  updateContext: (progress: OnboardingProgressData) => void
}

export class ThinkingMessageService {
  private static instance: ThinkingMessageService
  private messageIntervals = new Map<string, NodeJS.Timeout>()
  private currentMessages = new Map<string, string>()
  private currentIndices = new Map<string, number>()
  private messageArrays = new Map<string, string[]>()
  private messageCallbacks = new Map<string, ((message: string, index: number, total: number) => void)[]>()

  private constructor() {}

  static getInstance(): ThinkingMessageService {
    try {
      if (!ThinkingMessageService.instance) {
        ThinkingMessageService.instance = new ThinkingMessageService()
      }
      return ThinkingMessageService.instance
    } catch (error) {
      console.error('ThinkingMessageService getInstance error:', error)
      // Return a new instance as fallback
      return new ThinkingMessageService()
    }
  }

  // Fetch real business info fields for intelligent context
  private async fetchBusinessInfoFields(organizationId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/business-info-fields`)
      if (response.ok) {
        const data = await response.json()
        return data.fields || []
      }
    } catch (error) {
      console.error('Error fetching business info fields:', error)
    }
    return []
  }

  // Generate intelligent messages based on real data like Cursor
  private async generateIntelligentMessages(progress: OnboardingProgressData, organizationId?: string): Promise<string[]> {
    if (progress.isCompleted) {
      return ['🎉 Setup complete!', '✅ Your AI assistant is ready', '🚀 All systems operational']
    }

    if (!organizationId) {
      return ['🤖 AI is thinking...', '💭 Processing your request...', '⚡ Working on it...']
    }

    try {
      // Get real business info fields
      const fields = await this.fetchBusinessInfoFields(organizationId)
      
      if (fields.length === 0) {
        return [
          '🧠 Analyzing your business needs...',
          '💡 Preparing personalized questions...',
          '📝 Setting up your profile...'
        ]
      }

      // Find current/pending questions
      const pendingFields = fields.filter((f: any) => !f.is_answered)
      const answeredFields = fields.filter((f: any) => f.is_answered)
      
      if (pendingFields.length > 0) {
        const currentField = pendingFields[0]
        const fieldName = currentField.field_name || 'information'
        
        // Generate contextual messages based on actual field being processed
        return this.generateFieldSpecificMessages(fieldName, currentField.question_template)
      }

      // If no pending, we're processing answers
      if (answeredFields.length > 0) {
        const lastField = answeredFields[answeredFields.length - 1]
        return [
          `✨ Processing your ${lastField.field_name}...`,
          `🔍 Analyzing "${lastField.field_value}"...`,
          `💡 Understanding your business better...`,
          `📊 Updating your profile...`
        ]
      }

    } catch (error) {
      console.error('Error generating intelligent messages:', error)
    }

    // Fallback
    return ['🤖 AI is thinking...', '💭 Processing...', '⚡ Working on it...']
  }

  // Generate messages based on actual field names - like Cursor's contextual intelligence
  private generateFieldSpecificMessages(fieldName: string, questionTemplate?: string): string[] {
    const field = fieldName.toLowerCase()
    
    // Business name related
    if (field.includes('name') || field.includes('business')) {
      return [
        '✨ Processing your business identity...',
        '🏷️ Understanding your brand name...',
        '📝 Registering business information...',
        '🔤 Analyzing business nomenclature...'
      ]
    }
    
    // Industry/type related
    if (field.includes('industry') || field.includes('type') || field.includes('category')) {
      return [
        '🏢 Categorizing your business type...',
        '📊 Understanding your industry sector...',
        '🎯 Identifying business classification...',
        '💼 Processing industry specifics...'
      ]
    }
    
    // Hours/schedule related
    if (field.includes('hour') || field.includes('schedule') || field.includes('time')) {
      return [
        '⏰ Configuring operating hours...',
        '📅 Setting up availability schedule...',
        '🕐 Processing time preferences...',
        '⏱️ Organizing business calendar...'
      ]
    }
    
    // Contact/communication related
    if (field.includes('contact') || field.includes('phone') || field.includes('email') || field.includes('communication')) {
      return [
        '📞 Setting up communication channels...',
        '💬 Configuring contact methods...',
        '📧 Processing contact preferences...',
        '🔗 Establishing connection protocols...'
      ]
    }
    
    // Location/address related
    if (field.includes('location') || field.includes('address') || field.includes('city')) {
      return [
        '📍 Processing location details...',
        '🗺️ Understanding your business location...',
        '🏪 Setting up address information...',
        '📌 Configuring geographic data...'
      ]
    }
    
    // Services related
    if (field.includes('service') || field.includes('product') || field.includes('offer')) {
      return [
        '🛠️ Understanding your service offerings...',
        '📋 Processing service descriptions...',
        '💼 Analyzing business capabilities...',
        '🎯 Learning value propositions...'
      ]
    }
    
    // Customer related
    if (field.includes('customer') || field.includes('client') || field.includes('target')) {
      return [
        '👥 Understanding your customer base...',
        '🎯 Analyzing target audience...',
        '📊 Processing customer insights...',
        '💡 Learning customer preferences...'
      ]
    }
    
    // Use question template for more context
    if (questionTemplate) {
      const template = questionTemplate.toLowerCase()
      if (template.includes('describe')) {
        return [
          '📝 Processing your description...',
          '💭 Understanding the details...',
          '🔍 Analyzing your response...',
          '📊 Building your profile...'
        ]
      }
      if (template.includes('how many') || template.includes('number')) {
        return [
          '🔢 Processing numerical data...',
          '📊 Analyzing quantities...',
          '💯 Understanding scale...',
          '📈 Computing metrics...'
        ]
      }
    }
    
    // Generic field processing
    return [
      `✨ Processing ${fieldName.replace(/_/g, ' ')}...`,
      `🔍 Analyzing your input...`,
      `💡 Understanding the details...`,
      `📊 Updating your profile...`
    ]
  }

  private getContextualMessages(context: ThinkingContext): string[] {
    // Simple fallback messages for when real data isn't available
    const defaultMessages = {
      default: [
        "🤖 AI is thinking...",
        "💭 Processing your request...",
        "⚡ Working on it...",
        "🔄 Analyzing information..."
      ]
    }

    return defaultMessages.default
  }

  private getMessagesForContext(context: ThinkingContext): string[] {
    return this.getContextualMessages(context)
  }

  createMessageStream(context: ThinkingContext, instanceId: string = 'default', onboardingProgress?: OnboardingProgressData, organizationId?: string): MessageStream {
    let messages: string[] = []
    let currentIndex = 0
    
    // Initialize with default messages
    if (onboardingProgress && organizationId) {
      // This will be replaced with real data when start() is called
      messages = ['🤖 AI is thinking...']
    } else {
      messages = this.getMessagesForContext(context)
    }
    
    // Initialize with first message
    this.currentMessages.set(instanceId, messages[0] || 'AI is thinking...')
    this.currentIndices.set(instanceId, 0)
    this.messageArrays.set(instanceId, messages)
    this.messageCallbacks.set(instanceId, [])

    const start = async () => {
      // Clear any existing interval for this instance
      this.stop(instanceId)
      
      // If we have onboarding progress and organization ID, fetch real intelligent messages
      if (onboardingProgress && organizationId) {
        try {
          messages = await this.generateIntelligentMessages(onboardingProgress, organizationId)
          this.messageArrays.set(instanceId, messages)
        } catch (error) {
          console.error('Error generating intelligent messages:', error)
          messages = ['🤖 AI is thinking...', '💭 Processing...', '⚡ Working on it...']
        }
      }
      
      // Set initial message
      const initialMessage = messages[currentIndex] || 'AI is thinking...'
      this.currentMessages.set(instanceId, initialMessage)
      this.notifyCallbacks(instanceId, initialMessage)
      
      // Only cycle through messages if there's more than one
      if (messages.length > 1) {
        const interval = setInterval(() => {
          const storedIndex = this.currentIndices.get(instanceId) || 0
          const newIndex = (storedIndex + 1) % messages.length
          this.currentIndices.set(instanceId, newIndex)
          
          const newMessage = messages[newIndex]
          this.currentMessages.set(instanceId, newMessage)
          this.notifyCallbacks(instanceId, newMessage)
        }, 3000) // Change every 3 seconds like Cursor
        
        this.messageIntervals.set(instanceId, interval)
      }
    }

    const stop = () => {
      this.stop(instanceId)
    }

    const getCurrentMessage = () => {
      return this.currentMessages.get(instanceId) || messages[0] || 'AI is thinking...'
    }

    const getAllMessages = () => {
      return this.messageArrays.get(instanceId) || messages
    }

    const getCurrentIndex = () => {
      return this.currentIndices.get(instanceId) || 0
    }

    const onMessageChange = (callback: (message: string, index: number, total: number) => void) => {
      const callbacks = this.messageCallbacks.get(instanceId) || []
      callbacks.push(callback)
      this.messageCallbacks.set(instanceId, callbacks)
    }

    const updateContext = async (progress: OnboardingProgressData) => {
      try {
        // Generate new intelligent messages based on updated progress
        const newMessages = organizationId 
          ? await this.generateIntelligentMessages(progress, organizationId)
          : this.getMessagesForContext('default')
        
        // Update stored messages
        this.messageArrays.set(instanceId, newMessages)
        messages = newMessages
        
        // Reset to first message of new context
        currentIndex = 0
        this.currentIndices.set(instanceId, 0)
        const newMessage = newMessages[0] || 'AI is thinking...'
        this.currentMessages.set(instanceId, newMessage)
        
        // Notify callbacks with new context
        this.notifyCallbacks(instanceId, newMessage)
        
        // Restart cycling with new messages
        if (this.messageIntervals.has(instanceId)) {
          stop()
          await start()
        }
      } catch (error) {
        console.error('Error updating context:', error)
      }
    }

    return {
      start,
      stop,
      getCurrentMessage,
      getAllMessages,
      getCurrentIndex,
      onMessageChange,
      updateContext
    }
  }

  private stop(instanceId: string) {
    const interval = this.messageIntervals.get(instanceId)
    if (interval) {
      clearInterval(interval)
      this.messageIntervals.delete(instanceId)
    }
  }

  private notifyCallbacks(instanceId: string, message: string) {
    const callbacks = this.messageCallbacks.get(instanceId) || []
    const currentIndex = this.currentIndices.get(instanceId) || 0
    const messages = this.messageArrays.get(instanceId) || []
    callbacks.forEach(callback => callback(message, currentIndex, messages.length))
  }

  // Clean up method for when components unmount
  cleanup(instanceId: string) {
    this.stop(instanceId)
    this.currentMessages.delete(instanceId)
    this.currentIndices.delete(instanceId)
    this.messageArrays.delete(instanceId)
    this.messageCallbacks.delete(instanceId)
  }

  // Clean up all instances
  cleanupAll() {
    this.messageIntervals.forEach((interval) => clearInterval(interval))
    this.messageIntervals.clear()
    this.currentMessages.clear()
    this.messageCallbacks.clear()
  }
}

// Export singleton instance
export const thinkingMessageService = ThinkingMessageService.getInstance()