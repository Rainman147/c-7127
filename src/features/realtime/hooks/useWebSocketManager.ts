import { useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { WebSocketError } from '../types/errors';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useWebSocketManager = (
  channel: RealtimeChannel | undefined,
  onError: (error: WebSocketError) => void,
  componentId: string
) => {
  const lastPingTime = useRef<number>(Date.now());
  const reconnectAttempts = useRef<number>(0);

  useEffect(() => {
    if (!channel) {
      logger.debug(LogCategory.WEBSOCKET, 'WebSocketManager', 'No channel provided');
      return;
    }

    const handleError = (event: Event) => {
      logger.error(LogCategory.WEBSOCKET, 'WebSocketManager', 'WebSocket error:', {
        event,
        componentId,
        timestamp: new Date().toISOString()
      });

      onError({
        name: 'WebSocketError',
        message: 'WebSocket connection error',
        timestamp: new Date().toISOString(),
        connectionState: 'error',
        retryCount: reconnectAttempts.current,
        lastAttempt: Date.now(),
        backoffDelay: Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000),
        reason: 'Connection error'
      });
    };

    const socket = (channel as any)?.subscription?.socket;
    if (socket) {
      socket.addEventListener('error', handleError);
      
      return () => {
        socket.removeEventListener('error', handleError);
      };
    }
  }, [channel, onError, componentId]);

  return {
    lastPingTime: lastPingTime.current,
    reconnectAttempts: reconnectAttempts.current
  };
};