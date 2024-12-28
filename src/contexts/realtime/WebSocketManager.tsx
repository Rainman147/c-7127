import { useEffect, useRef, useCallback } from 'react';
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
  const metrics = useRef({
    totalMessages: 0,
    errors: 0,
    reconnects: 0,
    lastMessageTime: Date.now()
  });

  const logWebSocketMetrics = useCallback(() => {
    logger.info(LogCategory.METRICS, 'WebSocketManager', 'WebSocket metrics', {
      totalMessages: metrics.current.totalMessages,
      errors: metrics.current.errors,
      reconnects: metrics.current.reconnects,
      timeSinceLastMessage: Date.now() - metrics.current.lastMessageTime,
      reconnectAttempts: reconnectAttempts.current,
      timestamp: new Date().toISOString()
    });
  }, []);

  const { handleOpen, handleClose, handleError } = useWebSocketEvents({
    lastPingTime,
    reconnectAttempts,
    channelName: channel?.subscribe?.name,
    onMetricsUpdate: (type: 'message' | 'error' | 'reconnect') => {
      if (type === 'message') metrics.current.totalMessages++;
      if (type === 'error') metrics.current.errors++;
      if (type === 'reconnect') metrics.current.reconnects++;
      metrics.current.lastMessageTime = Date.now();
    }
  });

  const { startHealthCheck, stopHealthCheck } = useWebSocketHealth({
    channel,
    lastPingTime: lastPingTime.current,
    reconnectAttempts: reconnectAttempts.current,
  });

  useEffect(() => {
    if (!channel) {
      logger.warn(LogCategory.WEBSOCKET, 'WebSocketManager', 'No channel provided');
      return;
    }

    const socket = (channel as any)?.subscription?.socket;
    if (!socket) {
      logger.warn(LogCategory.WEBSOCKET, 'WebSocketManager', 'No socket found in channel');
      return;
    }

    logger.info(LogCategory.WEBSOCKET, 'WebSocketManager', 'Setting up WebSocket', {
      channelName: channel.subscribe.name,
      timestamp: new Date().toISOString()
    });

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('close', handleClose);
    socket.addEventListener('error', (event) => handleError(event, onError));

    const cleanupHealth = startHealthCheck(socket);
    const metricsInterval = setInterval(logWebSocketMetrics, 30000);

    return () => {
      logger.info(LogCategory.WEBSOCKET, 'WebSocketManager', 'Cleaning up WebSocket', {
        channelName: channel.subscribe.name,
        finalMetrics: metrics.current,
        timestamp: new Date().toISOString()
      });

      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('close', handleClose);
      socket.removeEventListener('error', (event) => handleError(event, onError));

      cleanupHealth();
      clearInterval(metricsInterval);
    };
  }, [channel, onError, handleOpen, handleClose, handleError, startHealthCheck, logWebSocketMetrics]);

  return {
    lastPingTime: lastPingTime.current,
    reconnectAttempts: reconnectAttempts.current,
    metrics: metrics.current
  };
};