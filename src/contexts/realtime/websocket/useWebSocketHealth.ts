import { useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { RealtimeChannel } from '@supabase/supabase-js';

const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

interface WebSocketHealthProps {
  channel: RealtimeChannel | undefined;
  lastPingTime: number;
  reconnectAttempts: number;
}

export const useWebSocketHealth = ({
  channel,
  lastPingTime,
  reconnectAttempts
}: WebSocketHealthProps) => {
  const startHealthCheck = useCallback((socket: WebSocket) => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      const timeSinceLastPing = now - lastPingTime;
      
      logger.debug(LogCategory.WEBSOCKET, 'WebSocketManager', 'Health check', {
        timeSinceLastPing,
        timestamp: new Date().toISOString(),
        channelId: channel?.subscribe?.name,
        socketState: socket.readyState,
        reconnectAttempts
      });

      if (timeSinceLastPing > HEALTH_CHECK_TIMEOUT) {
        logger.warn(LogCategory.WEBSOCKET, 'WebSocketManager', 'Connection health check failed', {
          timeSinceLastPing,
          timestamp: new Date().toISOString(),
          channelId: channel?.subscribe?.name,
          socketState: socket.readyState,
          reconnectAttempts
        });

        // Trigger reconnection if needed
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
          channel?.unsubscribe();
        }
      }
    }, HEALTH_CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [channel, lastPingTime, reconnectAttempts]);

  const stopHealthCheck = useCallback(() => {
    // This is a placeholder for any additional cleanup needed
    logger.debug(LogCategory.WEBSOCKET, 'WebSocketManager', 'Health check stopped');
  }, []);

  return {
    startHealthCheck,
    stopHealthCheck
  };
};