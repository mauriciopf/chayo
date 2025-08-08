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

export type ThinkingPhase =
  | 'initializing'
  | 'checkingExistingQuestion'
  | 'buildingContext'
  | 'buildingPrompt'
  | 'retrievingKnowledge'
  | 'callingAI'
  | 'parsingResponse'
  | 'updatingProfile'
  | 'updatingProgress'
  | 'switchingMode'
  | 'done'

export interface OnboardingProgressData {
  currentStage: 'stage_1' | 'stage_2' | 'stage_3'
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
  updatePhase: (phase: string) => void
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

  // Removed field-specific and API-driven hints for simplicity

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
    messages = this.getMessagesForContext(context)
    
    // Initialize with first message
    this.currentMessages.set(instanceId, messages[0] || 'AI is thinking...')
    this.currentIndices.set(instanceId, 0)
    this.messageArrays.set(instanceId, messages)
    this.messageCallbacks.set(instanceId, [])

    const start = async () => {
      // Clear any existing interval for this instance
      this.stop(instanceId)
      // Use whatever is already in the message array
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
        // Simple stage-based defaults when no phase overrides are active
        let newMessages: string[] = []
        if (progress.isCompleted) {
          newMessages = ['🎉 Setup complete!', '✅ Your AI assistant is ready']
        } else {
          const stage = progress.currentStage
          if (stage === 'stage_1') newMessages = ['🧠 Getting the basics...', '✍️ Collecting essential details...']
          else if (stage === 'stage_2') newMessages = ['🔎 Deep-diving into your services...', '📚 Gathering industry specifics...']
          else if (stage === 'stage_3') newMessages = ['🔧 Finalizing preferences...', '📞 Configuring communication & logistics...']
          else newMessages = this.getContextualMessages('default')
        }
        
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

    const updatePhase = (phase: string) => {
      const map: Record<string, string[]> = {
        initializing: ['🤖 Getting things ready...', '🔧 Preparing context...'],
        checkingExistingQuestion: ['🔎 Checking pending questions...', '🧭 Looking for where we left off...'],
        buildingContext: ['🧠 Summarizing what we already know...', '📋 Reviewing your answers...'],
        buildingPrompt: ['✍️ Framing the next question...', '🧩 Structuring the assistant prompt...'],
        retrievingKnowledge: ['📚 Reviewing your previous answers...', '🔎 Retrieving relevant info...'],
        callingAI: ['🤝 Talking to the assistant...', '📡 Generating the best next step...'],
        parsingResponse: ['🔍 Interpreting the response...', '🧪 Validating result...'],
        updatingProfile: ['💾 Saving your business info...', '📊 Updating your profile...'],
        updatingProgress: ['📈 Updating progress...', '🗂️ Advancing your onboarding...'],
        switchingMode: ['🎭 Switching to role-play...', '🚀 Preparing training mode...'],
        done: ['✅ Done', '🎉 Ready']
      }
      const msgs = map[phase]
      if (msgs && msgs.length > 0) {
        this.messageArrays.set(instanceId, msgs)
        this.currentIndices.set(instanceId, 0)
        const m = msgs[0]
        this.currentMessages.set(instanceId, m)
        this.notifyCallbacks(instanceId, m)
      }
    }

    return {
      start,
      stop,
      getCurrentMessage,
      getAllMessages,
      getCurrentIndex,
      onMessageChange,
      updateContext,
      updatePhase
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