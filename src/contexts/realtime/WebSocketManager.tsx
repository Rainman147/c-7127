import { useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { WebSocketError } from './types/errors';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useWebSocketManager = (
  channel: RealtimeChannel | undefined,
  onError: (error: WebSocketError) => void
) => {
  const lastPingTime = useRef<number>(Date.now());
  const healthCheckInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!channel) {
      logger.debug(LogCategory.WEBSOCKET, 'WebSocketManager', 'No channel provided');
      return;
    }

    const socket = (channel as any).socket;
    if (!socket) {
      logger.warn(LogCategory.WEBSOCKET, 'WebSocketManager', 'No socket found in channel');
      return;
    }

    const handleOpen = () => {
      logger.info(LogCategory.WEBSOCKET, 'WebSocketManager', 'Connection opened', {
        timestamp: new Date().toISOString()
      });
      lastPingTime.current = Date.now();
    };

    const handleClose = (event: CloseEvent) => {
      logger.warn(LogCategory.WEBSOCKET, 'WebSocketManager', 'Connection closed', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        timestamp: new Date().toISOString()
      });
    };

    const handleError = (error: Event) => {
      const errorData: WebSocketError = {
        timestamp: new Date().toISOString(),
        connectionState: socket.readyState.toString(),
        retryCount: 0,
        reason: error instanceof Error ? error.message : 'Unknown error',
        name: 'WebSocketError',
        message: error instanceof Error ? error.message : 'WebSocket connection error'
      };
      
      logger.error(LogCategory.WEBSOCKET, 'WebSocketManager', 'Connection error', errorData);
      onError(errorData);
    };

    // Set up health check
    healthCheckInterval.current = setInterval(() => {
      const now = Date.now();
      if (now - lastPingTime.current > 30000) { // 30 seconds
        logger.warn(LogCategory.WEBSOCKET, 'WebSocketManager', 'Connection health check failed', {
          timeSinceLastPing: now - lastPingTime.current,
          timestamp: new Date().toISOString()
        });
      }
    }, 10000);

    socket.onopen = handleOpen;
    socket.onclose = handleClose;
    socket.onerror = handleError;

    return () => {
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
      }
      socket.onopen = null;
      socket.onclose = null;
      socket.onerror = null;
    };
  }, [channel, onError]);

  return {
    lastPingTime: lastPingTime.current
  };
};