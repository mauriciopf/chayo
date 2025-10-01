import { useState, useCallback, useRef, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { EventSource } from 'react-native-sse';
import { thinkingMessageService, ThinkingPhase } from '../services/ThinkingMessageService';

interface SSEProgressData {
  phase: ThinkingPhase;
  message?: string;
  progress?: number;
  context?: string;
}

interface UseSSEProgressReturn {
  connect: (sessionId: string, context?: string) => void;
  disconnect: () => void;
  isConnected: boolean;
  reconnect: () => void;
}

export const useSSEProgress = (organizationId?: string): UseSSEProgressReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const contextRef = useRef<string>('default');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  const connect = useCallback((sessionId: string, context: string = 'default') => {
    if (!organizationId) {
      console.warn('useSSEProgress: organizationId is required for SSE connection');
      return;
    }

    // Store session info for reconnection
    sessionIdRef.current = sessionId;
    contextRef.current = context;

    // Disconnect any existing connection
    disconnect();

    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://chayo.vercel.app';
      const url = `${baseUrl}/api/sse/chat-progress/${organizationId}/${sessionId}`;

      if (__DEV__) {
        console.log('SSE: Connecting to', url);
      }

      eventSourceRef.current = new EventSource(url, {
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });

      eventSourceRef.current.addEventListener('open', () => {
        if (__DEV__) {
          console.log('SSE: Connection opened');
        }
        setIsConnected(true);
        reconnectAttempts.current = 0;
      });

      eventSourceRef.current.addEventListener('message', (event) => {
        try {
          const data: SSEProgressData = JSON.parse(event.data);
          if (__DEV__) {
            console.log('SSE: Received message', data);
          }

          // Update existing ThinkingMessageService stream
          // Use getOrCreateMessageStream to avoid overwriting existing streams
          const existingStream = thinkingMessageService.getOrCreateMessageStream(context as any, sessionId);

          if (data.message) {
            // Direct message override
            existingStream.updatePhase({
              name: data.phase,
              message: data.message,
            });
          } else {
            // Use predefined phase messages
            existingStream.updatePhase(data.phase);
          }
        } catch (error) {
          if (__DEV__) {
            console.error('SSE: Error parsing message', error);
          }
        }
      });

      eventSourceRef.current.addEventListener('error', (error) => {
        if (__DEV__) {
          console.error('SSE: Connection error', error);
        }
        setIsConnected(false);

        // Implement exponential backoff for reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // 1s, 2s, 4s, 8s, 16s
          reconnectAttempts.current++;

          if (__DEV__) {
            console.log(`SSE: Attempting reconnection ${reconnectAttempts.current}/${maxReconnectAttempts} in ${delay}ms`);
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            if (sessionIdRef.current) {
              connect(sessionIdRef.current, contextRef.current);
            }
          }, delay);
        } else {
          if (__DEV__) {
            console.error('SSE: Max reconnection attempts reached');
          }
        }
      });

    } catch (error) {
      if (__DEV__) {
        console.error('SSE: Failed to create connection', error);
      }
      setIsConnected(false);
    }
  }, [organizationId, disconnect]);

  const reconnect = useCallback(() => {
    if (sessionIdRef.current) {
      reconnectAttempts.current = 0;
      connect(sessionIdRef.current, contextRef.current);
    }
  }, [connect]);

  // Handle app state changes (backgrounding/foregrounding)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        // Close connection when app goes to background to save battery
        if (__DEV__) {
          console.log('SSE: App backgrounded, closing connection');
        }
        disconnect();
      } else if (nextAppState === 'active' && sessionIdRef.current && !isConnected) {
        // Reconnect when app comes to foreground
        if (__DEV__) {
          console.log('SSE: App foregrounded, reconnecting');
        }
        connect(sessionIdRef.current, contextRef.current);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [connect, disconnect, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    isConnected,
    reconnect,
  };
};
