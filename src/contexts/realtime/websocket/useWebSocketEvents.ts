import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { WebSocketError } from '../types/errors';

interface WebSocketEventProps {
  lastPingTime: React.MutableRefObject<number>;
  reconnectAttempts: React.MutableRefObject<number>;
  channelName?: string;
  onMetricsUpdate: (type: 'message' | 'error' | 'reconnect') => void;
}

export const useWebSocketEvents = ({
  lastPingTime,
  reconnectAttempts,
  channelName,
  onMetricsUpdate
}: WebSocketEventProps) => {
  const handleOpen = useCallback(() => {
    logger.info(LogCategory.WEBSOCKET, 'WebSocketManager', 'Connection opened', {
      timestamp: new Date().toISOString(),
      channelId: channelName,
      reconnectAttempts: reconnectAttempts.current
    });
    lastPingTime.current = Date.now();
    reconnectAttempts.current = 0;
    onMetricsUpdate('message');
  }, [lastPingTime, reconnectAttempts, channelName, onMetricsUpdate]);

  const handleClose = useCallback((event: CloseEvent) => {
    logger.warn(LogCategory.WEBSOCKET, 'WebSocketManager', 'Connection closed', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
      timestamp: new Date().toISOString(),
      channelId: channelName,
      reconnectAttempts: reconnectAttempts.current
    });
    reconnectAttempts.current++;
    onMetricsUpdate('reconnect');
  }, [reconnectAttempts, channelName, onMetricsUpdate]);

  const handleError = useCallback((error: Event, onError: (error: WebSocketError) => void) => {
    const errorData: WebSocketError = {
      name: 'WebSocketError',
      message: error instanceof Error ? error.message : 'WebSocket connection error',
      timestamp: new Date().toISOString(),
      connectionState: 'error',
      retryCount: reconnectAttempts.current,
      reason: error instanceof Error ? error.message : 'Unknown error',
      lastAttempt: Date.now(),
      backoffDelay: Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
    };
    
    logger.error(LogCategory.WEBSOCKET, 'WebSocketManager', 'Connection error', {
      ...errorData,
      channelId: channelName
    });
    
    onError(errorData);
    onMetricsUpdate('error');
  }, [reconnectAttempts, channelName, onMetricsUpdate]);

  return {
    handleOpen,
    handleClose,
    handleError
  };
};