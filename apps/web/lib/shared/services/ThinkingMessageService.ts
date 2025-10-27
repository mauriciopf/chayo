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
  | 'otp_sending'
  | 'otp_verifying'

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
  | 'startingVibeCardGeneration'
  | 'generatingVibeCard'
  | 'analyzingBusiness'
  | 'craftingStory'
  | 'selectingColors'
  | 'generatingVibeImage'
  | 'finalizingVibeCard'
  | 'done'

// Simplified: We no longer need complex onboarding progress data
// Everything is handled by simple boolean completion status

interface MessageStream {
  start: () => void
  stop: () => void
  getCurrentMessage: () => string
  getAllMessages: () => string[]
  getCurrentIndex: () => number
  onMessageChange: (callback: (message: string, index: number, total: number) => void) => void
  updatePhase: (phase: string) => void
}

export class ThinkingMessageService {
  private static instance: ThinkingMessageService
  private messageIntervals = new Map<string, ReturnType<typeof setInterval>>()
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
    const contextMessages: Record<ThinkingContext, string[]> = {
      default: [
        "🤖 La IA está pensando...",
        "💭 Procesando tu solicitud...",
        "⚡ Trabajando en ello...",
        "🔄 Analizando la información..."
      ],
      otp_sending: [
        "📧 Enviando código de verificación...",
        "✉️ Preparando tu código...",
        "🔐 Generando código de acceso...",
        "📮 Enviando email de verificación..."
      ],
      otp_verifying: [
        "🔍 Verificando código...",
        "✅ Validando tu código...",
        "🔐 Confirmando acceso...",
        "⏳ Procesando verificación..."
      ],
      onboarding_in_progress: [
        "🤖 La IA está pensando...",
        "💭 Procesando tu solicitud...",
        "⚡ Trabajando en ello...",
        "🔄 Analizando la información..."
      ],
      business_name: [
        "🤖 La IA está pensando...",
        "💭 Procesando tu solicitud...",
        "⚡ Trabajando en ello...",
        "🔄 Analizando la información..."
      ],
      business_type: [
        "🤖 La IA está pensando...",
        "💭 Procesando tu solicitud...",
        "⚡ Trabajando en ello...",
        "🔄 Analizando la información..."
      ],
      business_hours: [
        "🤖 La IA está pensando...",
        "💭 Procesando tu solicitud...",
        "⚡ Trabajando en ello...",
        "🔄 Analizando la información..."
      ],
      contact_preferences: [
        "🤖 La IA está pensando...",
        "💭 Procesando tu solicitud...",
        "⚡ Trabajando en ello...",
        "🔄 Analizando la información..."
      ],
      industry_analysis: [
        "🤖 La IA está pensando...",
        "💭 Procesando tu solicitud...",
        "⚡ Trabajando en ello...",
        "🔄 Analizando la información..."
      ],
      service_details: [
        "🤖 La IA está pensando...",
        "💭 Procesando tu solicitud...",
        "⚡ Trabajando en ello...",
        "🔄 Analizando la información..."
      ],
      customer_workflow: [
        "🤖 La IA está pensando...",
        "💭 Procesando tu solicitud...",
        "⚡ Trabajando en ello...",
        "🔄 Analizando la información..."
      ],
      setup_finalization: [
        "🤖 La IA está pensando...",
        "💭 Procesando tu solicitud...",
        "⚡ Trabajando en ello...",
        "🔄 Analizando la información..."
      ]
    }

    return contextMessages[context] || contextMessages.default
  }

  private getMessagesForContext(context: ThinkingContext): string[] {
    return this.getContextualMessages(context)
  }

  createMessageStream(context: ThinkingContext, instanceId: string = 'default', _unused?: any, organizationId?: string): MessageStream {
    let messages: string[] = []
    let currentIndex = 0
    
    // Initialize with default messages
    messages = this.getMessagesForContext(context)
    
    // Initialize with first message
    this.currentMessages.set(instanceId, messages[0] || 'La IA está pensando...')
    this.currentIndices.set(instanceId, 0)
    this.messageArrays.set(instanceId, messages)
    this.messageCallbacks.set(instanceId, [])

    const start = async () => {
      // Clear any existing interval for this instance
      this.stop(instanceId)
      // Use whatever is already in the message array
      // Set initial message
      const initialMessage = messages[currentIndex] || 'La IA está pensando...'
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
      return this.currentMessages.get(instanceId) || messages[0] || 'La IA está pensando...'
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

    // Removed updateContext - no longer needed with simplified onboarding

    const updatePhase = (phase: string | any) => {
      // Support both string phase and object with custom message
      let phaseData: any = phase
      let phaseName: string = phase
      
      if (typeof phase === 'object' && phase !== null) {
        phaseName = phase.name || 'default'
        // If custom message is provided, use it directly
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
        initializing: ['🤖 Preparando todo...', '🔧 Configurando el contexto...'],
        checkingExistingQuestion: ['🔎 Revisando preguntas pendientes...', '🧭 Buscando dónde nos quedamos...'],
        buildingContext: ['🧠 Resumiendo lo que ya sabemos...', '📋 Revisando tus respuestas...'],
        buildingPrompt: ['✍️ Preparando la siguiente pregunta...', '🧩 Estructurando el mensaje del asistente...'],
        retrievingKnowledge: ['📚 Repasando tus respuestas anteriores...', '🔎 Recuperando información relevante...'],
        callingAI: ['🤝 Consultando al asistente...', '📡 Generando el mejor siguiente paso...'],
        parsingResponse: ['🔍 Interpretando la respuesta...', '🧪 Validando el resultado...'],
        updatingProfile: ['💾 Guardando la información de tu negocio...', '📊 Actualizando tu perfil...'],
        updatingProgress: ['📈 Actualizando tu progreso...', '🗂️ Avanzando en tu onboarding...'],
        switchingMode: [
          '🎉 ¡Configuración completa! Entrando en modo negocio...',
          '⚙️ Configurando tu asistente empresarial...',
          '🔄 Iniciando modo de entrenamiento...',
          '✨ Preparando todo para ayudarte con tu negocio...'
        ],
        generatingVibeCard: [
          '🎨 Creando tu tarjeta de vibra del marketplace...',
          '✨ Preparando la historia única de tu negocio...'
        ],
        analyzingBusiness: [
          '🔍 Analizando la información de tu negocio...',
          '📊 Entendiendo tu historia y valores únicos...'
        ],
        craftingStory: [
          '📝 Redactando una narrativa atractiva para tu negocio...',
          '💫 Uniendo todos los elementos de tu historia...'
        ],
        selectingColors: [
          '🎨 Seleccionando los colores perfectos para tu marca...',
          '🌈 Eligiendo tonos que reflejan tu vibra...'
        ],
        generatingVibeImage: [
          '🖼️ La IA está creando la imagen de tu tarjeta de vibra...',
          '🎭 Pintando tu identidad visual...',
          '⏳ Esto puede tardar 1-2 minutos para lograr la mejor calidad...'
        ],
        finalizingVibeCard: [
          '✨ Dando los últimos toques a tu tarjeta de vibra...',
          '🎯 Cuidando cada detalle...'
        ],
        'auth-check': ['🔐 Verificando autenticación...', '🛡️ Revisando credenciales...'],
        'dashboard-loading': ['📊 Cargando la información de tu negocio...', '🏢 Inicializando el panel...'],
        done: ['✅ Listo', '🎉 Preparado']
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
