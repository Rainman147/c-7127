import { useEffect, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useWebSocketEvents } from './websocket/useWebSocketEvents';
import { useWebSocketHealth } from './websocket/useWebSocketHealth';
import type { WebSocketError } from './types/errors';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useWebSocketManager = (
  channel: RealtimeChannel | undefined,
  onError: (error: WebSocketError) => void
) => {
  const lastPingTime = useRef<number>(Date.now());
  const reconnectAttempts = useRef<number>(0);

  const { handleOpen, handleClose, handleError } = useWebSocketEvents({
    lastPingTime,
    reconnectAttempts,
    channelName: channel?.subscribe?.name,
  });

  const { startHealthCheck, stopHealthCheck } = useWebSocketHealth({
    channel,
    lastPingTime: lastPingTime.current,
    reconnectAttempts: reconnectAttempts.current,
  });

  useEffect(() => {
    if (!channel) {
      logger.debug(LogCategory.WEBSOCKET, 'WebSocketManager', 'No channel provided');
      return;
    }

    // Get the underlying WebSocket instance
    const socket = (channel as any)?.subscription?.socket;
    if (!socket) {
      logger.warn(LogCategory.WEBSOCKET, 'WebSocketManager', 'No socket found in channel');
      return;
    }

    // Set up event listeners
    socket.addEventListener('open', handleOpen);
    socket.addEventListener('close', handleClose);
    socket.addEventListener('error', (event) => handleError(event, onError));

    // Start health check monitoring
    const cleanupHealth = startHealthCheck(socket);

    return () => {
      logger.info(LogCategory.WEBSOCKET, 'WebSocketManager', 'Cleaning up WebSocket manager', {
        timestamp: new Date().toISOString(),
        channelId: channel.subscribe.name,
        reconnectAttempts: reconnectAttempts.current
      });

      // Clean up event listeners
      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('close', handleClose);
      socket.removeEventListener('error', (event) => handleError(event, onError));

      // Stop health check monitoring
      cleanupHealth();
    };
  }, [channel, onError, handleOpen, handleClose, handleError, startHealthCheck]);

  return {
    lastPingTime: lastPingTime.current,
    reconnectAttempts: reconnectAttempts.current
  };
};