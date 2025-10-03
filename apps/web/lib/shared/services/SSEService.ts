/**
 * SSE Service
 * 
 * Centralized service for Server-Sent Events emission and handling.
 * Provides type-safe event emission with proper error handling.
 * 
 * Design Principles:
 * - Single Responsibility: Only handles SSE event emission
 * - Type Safety: All events are strictly typed
 * - Error Handling: Gracefully handles emission failures
 * - Logging: Comprehensive logging for debugging
 */

import { 
  SSEEventType, 
  SSEEventPayload, 
  SSEEmitter,
  ModalEvent,
  ProgressEvent,
  StateEvent,
  ResultEvent,
  ErrorEvent
} from '@/lib/shared/types/sseEvents'

export class SSEService {
  /**
   * Create a type-safe SSE emitter function
   * This is used on the server-side to emit events through the SSE stream
   */
  static createEmitter(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder
  ): SSEEmitter {
    return <T extends SSEEventType>(eventType: T, data: SSEEventPayload<T>) => {
      try {
        const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(payload))
        
        // Log for debugging
        console.log(`📡 [SSE-EMIT] ${eventType}:`, data)
      } catch (error) {
        console.error(`❌ [SSE-EMIT] Failed to emit ${eventType}:`, error)
      }
    }
  }

  /**
   * Emit a modal control event
   */
  static emitModalEvent(
    emit: SSEEmitter,
    event: ModalEvent
  ): void {
    emit('modal', event)
  }

  /**
   * Emit a progress event
   */
  static emitProgressEvent(
    emit: SSEEmitter,
    event: ProgressEvent
  ): void {
    emit('progress', event)
  }

  /**
   * Emit a state event
   */
  static emitStateEvent(
    emit: SSEEmitter,
    event: StateEvent
  ): void {
    emit('state', event)
  }

  /**
   * Emit a result event
   */
  static emitResultEvent(
    emit: SSEEmitter,
    event: ResultEvent
  ): void {
    emit('result', event)
  }

  /**
   * Emit an error event
   */
  static emitErrorEvent(
    emit: SSEEmitter,
    event: ErrorEvent
  ): void {
    emit('error', event)
  }


  /**
   * Helper: Show vibe card generation modal
   */
  static showVibeCardModal(emit: SSEEmitter): void {
    this.emitModalEvent(emit, {
      action: 'show',
      modal: 'vibeCardGeneration'
    })
  }

  /**
   * Helper: Hide vibe card generation modal
   */
  static hideVibeCardModal(emit: SSEEmitter): void {
    this.emitModalEvent(emit, {
      action: 'hide',
      modal: 'vibeCardGeneration'
    })
  }

  /**
   * Helper: Update vibe card generation progress
   */
  static updateVibeCardProgress(
    emit: SSEEmitter,
    stage: ProgressEvent['stage'],
    percent: number,
    message: string
  ): void {
    this.emitProgressEvent(emit, {
      stage,
      percent,
      message
    })
  }

  /**
   * Helper: Emit onboarding completion status
   */
  static notifyOnboardingComplete(emit: SSEEmitter): void {
    this.emitStateEvent(emit, {
      change: 'onboarding_completed'
    })
  }

  /**
   * Helper: Emit mode switch notification
   */
  static notifyModeSwitch(
    emit: SSEEmitter,
    from: string,
    to: string
  ): void {
    this.emitStateEvent(emit, {
      change: 'mode_switch',
      from,
      to
    })
  }
}

