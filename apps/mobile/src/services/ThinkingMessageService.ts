export type ThinkingContext = 
  | 'onboarding_in_progress'
  | 'default'
  | 'business_name'
  | 'business_type' 
  | 'business_hours'
  | 'contact_preferences'
  | 'industry_analysis'
  | 'service_details'
  | 'customer_workflow'
  | 'setup_finalization'
  | 'slug_validation'
  | 'customer-support'

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
  | 'detectingSlug'
  | 'validatingSlug'
  | 'loadingConfig'
  | 'savingData'
  | 'done'

interface MessageStream {
  start: () => void
  stop: () => void
  getCurrentMessage: () => string
  getAllMessages: () => string[]
  getCurrentIndex: () => number
  onMessageChange: (callback: (message: string, index: number, total: number) => void) => void
  updatePhase: (phase: string | { name?: string; message?: string }) => void
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
      return new ThinkingMessageService()
    }
  }

  private getContextualMessages(context: ThinkingContext): string[] {
    const contextMessages = {
      default: [
        "🤖 AI is thinking...",
        "💭 Processing your request...",
        "⚡ Working on it...",
        "🔄 Analyzing information..."
      ],
      slug_validation: [
        "🔍 Analizando mensaje...",
        "🏢 Verificando código de negocio...",
        "⚙️ Cargando configuración...",
        "💾 Guardando datos..."
      ],
      onboarding_in_progress: [
        "🧠 Procesando información...",
        "📋 Generando siguiente pregunta...",
        "🔄 Actualizando perfil..."
      ]
    }

    return contextMessages[context] || contextMessages.default
  }

  private getMessagesForContext(context: ThinkingContext): string[] {
    return this.getContextualMessages(context)
  }

  getOrCreateMessageStream(context: ThinkingContext, instanceId: string = 'default', onboardingProgress?: OnboardingProgressData, organizationId?: string): MessageStream {
    // If stream already exists, return methods to interact with it
    if (this.messageArrays.has(instanceId)) {
      return this.getExistingStreamMethods(instanceId);
    }
    
    // Otherwise create new stream
    return this.createMessageStream(context, instanceId, onboardingProgress, organizationId);
  }

  private getExistingStreamMethods(instanceId: string): MessageStream {
    const start = async () => {
      // Stream already exists, just restart cycling if needed
      this.stop(instanceId);
      const messages = this.messageArrays.get(instanceId) || [];
      if (messages.length > 1) {
        const interval = setInterval(() => {
          const storedIndex = this.currentIndices.get(instanceId) || 0;
          const newIndex = (storedIndex + 1) % messages.length;
          this.currentIndices.set(instanceId, newIndex);
          
          const newMessage = messages[newIndex];
          this.currentMessages.set(instanceId, newMessage);
          this.notifyCallbacks(instanceId, newMessage);
        }, 3000);
        
        this.messageIntervals.set(instanceId, interval);
      }
    };

    const stop = () => {
      this.stop(instanceId);
    };

    const getCurrentMessage = () => {
      return this.currentMessages.get(instanceId) || 'AI is thinking...';
    };

    const getAllMessages = () => {
      return this.messageArrays.get(instanceId) || [];
    };

    const getCurrentIndex = () => {
      return this.currentIndices.get(instanceId) || 0;
    };

    const onMessageChange = (callback: (message: string, index: number, total: number) => void) => {
      const callbacks = this.messageCallbacks.get(instanceId) || [];
      callbacks.push(callback);
      this.messageCallbacks.set(instanceId, callbacks);
    };

    const updateContext = async (progress: OnboardingProgressData) => {
      // Implementation similar to main createMessageStream
      try {
        let newMessages: string[] = [];
        if (progress.isCompleted) {
          newMessages = ['🎉 Setup complete!', '✅ Your AI assistant is ready'];
        } else {
          const stage = progress.currentStage;
          if (stage === 'stage_1') newMessages = ['🧠 Getting the basics...', '✍️ Collecting essential details...'];
          else if (stage === 'stage_2') newMessages = ['🔎 Deep-diving into your services...', '📚 Gathering industry specifics...'];
          else if (stage === 'stage_3') newMessages = ['🔧 Finalizing preferences...', '📞 Configuring communication & logistics...'];
          else newMessages = this.getContextualMessages('default');
        }
        
        this.messageArrays.set(instanceId, newMessages);
        this.currentIndices.set(instanceId, 0);
        const newMessage = newMessages[0] || 'AI is thinking...';
        this.currentMessages.set(instanceId, newMessage);
        this.notifyCallbacks(instanceId, newMessage);
        
        if (this.messageIntervals.has(instanceId)) {
          stop();
          await start();
        }
      } catch (error) {
        console.error('Error updating context:', error);
      }
    };

    const updatePhase = (phase: string | any) => {
      let phaseData: any = phase;
      let phaseName: string = phase;
      
      if (typeof phase === 'object' && phase !== null) {
        phaseName = phase.name || 'default';
        if (phase.message) {
          const customMessage = phase.message;
          this.messageArrays.set(instanceId, [customMessage]);
          this.currentIndices.set(instanceId, 0);
          this.currentMessages.set(instanceId, customMessage);
          this.notifyCallbacks(instanceId, customMessage);
          return;
        }
      }
      
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
        switchingMode: [
          '🎉 Setup completed! Transitioning to business mode...',
          '⚙️ Configuring your business assistant...',
          '🔄 Training mode is starting...',
          '✨ Getting ready to help with your business...'
        ],
        detectingSlug: ['🔍 Analizando mensaje...', '🤖 Detectando código de negocio...'],
        validatingSlug: ['🏢 Verificando código...', '🔐 Validando negocio...'],
        loadingConfig: ['⚙️ Cargando configuración...', '📊 Obteniendo datos del negocio...'],
        savingData: ['💾 Guardando datos...', '📱 Configurando aplicación...'],
        'auth-check': ['🔐 Verifying authentication...', '🛡️ Checking credentials...'],
        'dashboard-loading': ['📊 Loading your business data...', '🏢 Initializing dashboard...'],
        'customer-support': ['💬 Connecting to support team...', '👥 Notifying available agents...', '⏳ Waiting for agent response...'],
        done: ['✅ Done', '🎉 Ready']
      };
      
      const msgs = map[phaseName];
      if (msgs && msgs.length > 0) {
        this.messageArrays.set(instanceId, msgs);
        this.currentIndices.set(instanceId, 0);
        const m = msgs[0];
        this.currentMessages.set(instanceId, m);
        this.notifyCallbacks(instanceId, m);
      }
    };

    return {
      start,
      stop,
      getCurrentMessage,
      getAllMessages,
      getCurrentIndex,
      onMessageChange,
      updateContext,
      updatePhase
    };
  }

  createMessageStream(context: ThinkingContext, instanceId: string = 'default', onboardingProgress?: OnboardingProgressData, organizationId?: string): MessageStream {
    let messages: string[] = []
    let currentIndex = 0
    
    messages = this.getMessagesForContext(context)
    
    this.currentMessages.set(instanceId, messages[0] || 'AI is thinking...')
    this.currentIndices.set(instanceId, 0)
    this.messageArrays.set(instanceId, messages)
    this.messageCallbacks.set(instanceId, [])

    const start = async () => {
      this.stop(instanceId)
      const initialMessage = messages[currentIndex] || 'AI is thinking...'
      this.currentMessages.set(instanceId, initialMessage)
      this.notifyCallbacks(instanceId, initialMessage)
      
      if (messages.length > 1) {
        const interval = setInterval(() => {
          const storedIndex = this.currentIndices.get(instanceId) || 0
          const newIndex = (storedIndex + 1) % messages.length
          this.currentIndices.set(instanceId, newIndex)
          
          const newMessage = messages[newIndex]
          this.currentMessages.set(instanceId, newMessage)
          this.notifyCallbacks(instanceId, newMessage)
        }, 3000)
        
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
        
        this.messageArrays.set(instanceId, newMessages)
        messages = newMessages
        
        currentIndex = 0
        this.currentIndices.set(instanceId, 0)
        const newMessage = newMessages[0] || 'AI is thinking...'
        this.currentMessages.set(instanceId, newMessage)
        
        this.notifyCallbacks(instanceId, newMessage)
        
        if (this.messageIntervals.has(instanceId)) {
          stop()
          await start()
        }
      } catch (error) {
        console.error('Error updating context:', error)
      }
    }

    const updatePhase = (phase: string | any) => {
      let phaseData: any = phase
      let phaseName: string = phase
      
      if (typeof phase === 'object' && phase !== null) {
        phaseName = phase.name || 'default'
        if (phase.message) {
          const customMessage = phase.message
          this.messageArrays.set(instanceId, [customMessage])
          this.currentIndices.set(instanceId, 0)
          this.currentMessages.set(instanceId, customMessage)
          this.notifyCallbacks(instanceId, customMessage)
          return
        }
      }
      
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
        switchingMode: [
          '🎉 Setup completed! Transitioning to business mode...',
          '⚙️ Configuring your business assistant...',
          '🔄 Training mode is starting...',
          '✨ Getting ready to help with your business...'
        ],
        detectingSlug: ['🔍 Analizando mensaje...', '🤖 Detectando código de negocio...'],
        validatingSlug: ['🏢 Verificando código...', '🔐 Validando negocio...'],
        loadingConfig: ['⚙️ Cargando configuración...', '📊 Obteniendo datos del negocio...'],
        savingData: ['💾 Guardando datos...', '📱 Configurando aplicación...'],
        'auth-check': ['🔐 Verifying authentication...', '🛡️ Checking credentials...'],
        'dashboard-loading': ['📊 Loading your business data...', '🏢 Initializing dashboard...'],
        done: ['✅ Done', '🎉 Ready']
      }
      
      const msgs = map[phaseName]
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

  cleanup(instanceId: string) {
    this.stop(instanceId)
    this.currentMessages.delete(instanceId)
    this.currentIndices.delete(instanceId)
    this.messageArrays.delete(instanceId)
    this.messageCallbacks.delete(instanceId)
  }

  cleanupAll() {
    this.messageIntervals.forEach((interval) => clearInterval(interval))
    this.messageIntervals.clear()
    this.currentMessages.clear()
    this.messageCallbacks.clear()
  }
}

export const thinkingMessageService = ThinkingMessageService.getInstance()
