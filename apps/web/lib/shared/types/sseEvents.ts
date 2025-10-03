/**
 * Production SSE Event System
 * 
 * Design Goals:
 * 1. Prevent event overwrites (separate channels per event type)
 * 2. Future-proof (easy to add new event types)
 * 3. Type-safe (compile-time checks)
 * 4. Keep existing functionality working
 * 
 * Architecture:
 * - Each event type = separate state channel in React
 * - Events don't overwrite each other
 * - ThinkingMessageService handles "AI is thinking" messages
 * - SSE handles modals, progress, state changes, results
 */

// ============================================================================
// MODAL EVENTS - Control modal dialogs
// ============================================================================

export type ModalType = 'vibeCardGeneration'

export interface ModalEvent {
  action: 'show' | 'hide'
  modal: ModalType
}

// ============================================================================
// PROGRESS EVENTS - Update progress bars in modals
// ============================================================================

export type ProgressStage = 
  | 'analyzing_business'
  | 'crafting_story'
  | 'selecting_colors'
  | 'generating_image'
  | 'finalizing'
  | 'completed'

export interface ProgressEvent {
  stage: ProgressStage
  percent: number
  message: string
  estimatedTimeRemaining?: number
}

// ============================================================================
// STATE EVENTS - App-wide state changes
// ============================================================================

export type StateChange = 
  | 'onboarding_in_progress'
  | 'onboarding_completed'
  | 'mode_switch'

export interface StateEvent {
  change: StateChange
  from?: string
  to?: string
}

// ============================================================================
// RESULT EVENTS - AI responses
// ============================================================================

export interface ResultEvent {
  aiMessage: string
  multipleChoices?: string[]
  allowMultiple?: boolean
  agentChatLink?: string | null
}

// ============================================================================
// ERROR EVENTS - Error handling
// ============================================================================

export interface ErrorEvent {
  message: string
  severity: 'warning' | 'error' | 'fatal'
  recoverable?: boolean
  retryable?: boolean
  code?: string
}

// ============================================================================
// SSE EVENT MAP - Central registry of all event types
// ============================================================================

export interface SSEEventMap {
  modal: ModalEvent
  progress: ProgressEvent
  state: StateEvent
  result: ResultEvent
  error: ErrorEvent
}

// ============================================================================
// TYPE UTILITIES - Auto-derived types for type safety
// ============================================================================

export type SSEEventType = keyof SSEEventMap

export type SSEEventPayload<T extends SSEEventType> = SSEEventMap[T]

// ============================================================================
// SSE EMITTER - Type-safe function signature
// ============================================================================

export type SSEEmitter = <T extends SSEEventType>(
  eventType: T,
  data: SSEEventPayload<T>
) => void

/**
 * HOW TO ADD NEW EVENT TYPES:
 * 
 * 1. Define the event interface (e.g., NotificationEvent)
 * 2. Add it to SSEEventMap
 * 3. Add handler in useChat.ts
 * 4. Add helper method in SSEService.ts (optional)
 * 
 * That's it! TypeScript will enforce correctness everywhere.
 */
