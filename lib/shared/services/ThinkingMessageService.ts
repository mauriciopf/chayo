export type ThinkingContext = 
  | 'onboarding_stage_1' 
  | 'onboarding_stage_2' 
  | 'onboarding_stage_3' 
  | 'default'

interface MessageStream {
  start: () => void
  stop: () => void
  getCurrentMessage: () => string
  onMessageChange: (callback: (message: string) => void) => void
}

export class ThinkingMessageService {
  private static instance: ThinkingMessageService
  private messageIntervals = new Map<string, NodeJS.Timeout>()
  private currentMessages = new Map<string, string>()
  private messageCallbacks = new Map<string, ((message: string) => void)[]>()

  private constructor() {}

  static getInstance(): ThinkingMessageService {
    if (!ThinkingMessageService.instance) {
      ThinkingMessageService.instance = new ThinkingMessageService()
    }
    return ThinkingMessageService.instance
  }

  private getOnboardingMessages(stage: 'stage_1' | 'stage_2' | 'stage_3'): string[] {
    const messages = {
      stage_1: [
        "✨ Learning your business basics...",
        "🏢 Understanding your business name...", 
        "📋 Getting to know your services...",
        "💼 Processing your business information..."
      ],
      stage_2: [
        "🔍 Analyzing your industry...",
        "💼 Understanding your business model...",
        "🎯 Learning your customer patterns...",
        "📊 Processing operational details..."
      ],
      stage_3: [
        "⚙️ Finalizing your setup...",
        "📞 Configuring communication preferences...",
        "🚀 Almost ready to launch your AI assistant...",
        "✅ Completing your business profile..."
      ]
    }

    return messages[stage]
  }

  private getMessagesForContext(context: ThinkingContext): string[] {
    switch (context) {
      case 'onboarding_stage_1':
        return this.getOnboardingMessages('stage_1')
      case 'onboarding_stage_2':
        return this.getOnboardingMessages('stage_2')
      case 'onboarding_stage_3':
        return this.getOnboardingMessages('stage_3')
      case 'default':
      default:
        return ["AI is thinking..."]
    }
  }

  createMessageStream(context: ThinkingContext, instanceId: string = 'default'): MessageStream {
    const messages = this.getMessagesForContext(context)
    let currentIndex = 0
    
    // Initialize with first message
    this.currentMessages.set(instanceId, messages[0])
    this.messageCallbacks.set(instanceId, [])

    const start = () => {
      // Clear any existing interval for this instance
      this.stop(instanceId)
      
      // Set initial message
      this.currentMessages.set(instanceId, messages[currentIndex])
      this.notifyCallbacks(instanceId, messages[currentIndex])
      
      // Only cycle through messages if there's more than one
      if (messages.length > 1) {
        const interval = setInterval(() => {
          currentIndex = (currentIndex + 1) % messages.length
          const newMessage = messages[currentIndex]
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
      return this.currentMessages.get(instanceId) || messages[0]
    }

    const onMessageChange = (callback: (message: string) => void) => {
      const callbacks = this.messageCallbacks.get(instanceId) || []
      callbacks.push(callback)
      this.messageCallbacks.set(instanceId, callbacks)
    }

    return {
      start,
      stop,
      getCurrentMessage,
      onMessageChange
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
    callbacks.forEach(callback => callback(message))
  }

  // Clean up method for when components unmount
  cleanup(instanceId: string) {
    this.stop(instanceId)
    this.currentMessages.delete(instanceId)
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