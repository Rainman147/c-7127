import { useEffect, useRef } from 'react';
import { logger, wsLogger, LogCategory } from '@/utils/logging';
import type { RealtimeChannel } from '@supabase/supabase-js';

const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

export const useWebSocketHealth = (
  channel: RealtimeChannel | undefined,
  onHealthCheckFailed: () => void
) => {
  const lastPongRef = useRef<number>(Date.now());
  const healthCheckTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!channel) return;

    const checkHealth = () => {
      const now = Date.now();
      const timeSinceLastPong = now - lastPongRef.current;

      wsLogger.connectionStateChange('WebSocketHealth', 'health-check', 'checking', {
        timeSinceLastPong,
        threshold: HEALTH_CHECK_TIMEOUT
      });

      if (timeSinceLastPong > HEALTH_CHECK_TIMEOUT) {
        logger.warn(LogCategory.WEBSOCKET, 'WebSocketHealth', 'Health check failed', {
          timeSinceLastPong,
          threshold: HEALTH_CHECK_TIMEOUT
        });
        onHealthCheckFailed();
      }
    };

    // Set up periodic health checks
    const intervalId = setInterval(checkHealth, HEALTH_CHECK_INTERVAL);

    // Set up ping/pong for connection monitoring
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        wsLogger.connectionStateChange('WebSocketHealth', 'status', status, {
          timestamp: new Date().toISOString()
        });
        
        // Send ping and wait for pong
        healthCheckTimeoutRef.current = setTimeout(() => {
          checkHealth();
        }, HEALTH_CHECK_TIMEOUT);
      }
    });

    // Update last pong time when receiving any message
    const socket = (channel as any).socket;
    if (socket) {
      const originalOnMessage = socket.onmessage;
      socket.onmessage = (event: MessageEvent) => {
        lastPongRef.current = Date.now();
        if (originalOnMessage) {
          originalOnMessage.call(socket, event);
        }
      };
    }

    return () => {
      clearInterval(intervalId);
      if (healthCheckTimeoutRef.current) {
        clearTimeout(healthCheckTimeoutRef.current);
      }
    };
  }, [channel, onHealthCheckFailed]);

  return {
    lastPongTime: lastPongRef.current
  };
};