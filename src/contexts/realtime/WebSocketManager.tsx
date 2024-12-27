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
  const reconnectAttempts = useRef<number>(0);

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
        timestamp: new Date().toISOString(),
        channelId: channel.subscribe.name,
        reconnectAttempts: reconnectAttempts.current
      });
      lastPingTime.current = Date.now();
      reconnectAttempts.current = 0;
    };

    const handleClose = (event: CloseEvent) => {
      logger.warn(LogCategory.WEBSOCKET, 'WebSocketManager', 'Connection closed', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        timestamp: new Date().toISOString(),
        channelId: channel.subscribe.name,
        reconnectAttempts: reconnectAttempts.current
      });
      reconnectAttempts.current++;
    };

    const handleError = (error: Event) => {
      const errorData: WebSocketError = {
        timestamp: new Date().toISOString(),
        connectionState: socket.readyState.toString(),
        retryCount: reconnectAttempts.current,
        reason: error instanceof Error ? error.message : 'Unknown error',
        name: 'WebSocketError',
        message: error instanceof Error ? error.message : 'WebSocket connection error',
        lastAttempt: Date.now(),
        backoffDelay: Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
      };
      
      logger.error(LogCategory.WEBSOCKET, 'WebSocketManager', 'Connection error', {
        ...errorData,
        channelId: channel.subscribe.name,
        socketState: socket.readyState
      });
      
      onError(errorData);
    };

    // Set up health check with more detailed logging
    healthCheckInterval.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastPing = now - lastPingTime.current;
      
      logger.debug(LogCategory.WEBSOCKET, 'WebSocketManager', 'Health check', {
        timeSinceLastPing,
        timestamp: new Date().toISOString(),
        channelId: channel.subscribe.name,
        socketState: socket.readyState,
        reconnectAttempts: reconnectAttempts.current
      });

      if (timeSinceLastPing > 30000) {
        logger.warn(LogCategory.WEBSOCKET, 'WebSocketManager', 'Connection health check failed', {
          timeSinceLastPing,
          timestamp: new Date().toISOString(),
          channelId: channel.subscribe.name,
          socketState: socket.readyState,
          reconnectAttempts: reconnectAttempts.current
        });

        // Trigger reconnection if needed
        if (socket.readyState !== WebSocket.CONNECTING) {
          socket.close();
        }
      }
    }, 10000);

    socket.onopen = handleOpen;
    socket.onclose = handleClose;
    socket.onerror = handleError;

    return () => {
      logger.info(LogCategory.WEBSOCKET, 'WebSocketManager', 'Cleaning up WebSocket manager', {
        timestamp: new Date().toISOString(),
        channelId: channel.subscribe.name,
        reconnectAttempts: reconnectAttempts.current
      });

      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current);
      }
      socket.onopen = null;
      socket.onclose = null;
      socket.onerror = null;
    };
  }, [channel, onError]);

  return {
    lastPingTime: lastPingTime.current,
    reconnectAttempts: reconnectAttempts.current
  };
};