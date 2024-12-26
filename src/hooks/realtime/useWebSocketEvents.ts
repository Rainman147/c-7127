import { useEffect, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useRealTime } from '@/contexts/RealTimeContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useWebSocketEvents = (channel: RealtimeChannel | undefined) => {
  const { connectionState } = useRealTime();

  const handleWebSocketOpen = useCallback(() => {
    logger.info(LogCategory.COMMUNICATION, 'WebSocket', 'Connection opened', {
      timestamp: new Date().toISOString()
    });
  }, []);

  const handleWebSocketClose = useCallback(() => {
    logger.warn(LogCategory.COMMUNICATION, 'WebSocket', 'Connection closed', {
      timestamp: new Date().toISOString()
    });
  }, []);

  const handleWebSocketError = useCallback((error: Event) => {
    logger.error(LogCategory.ERROR, 'WebSocket', 'Connection error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }, []);

  useEffect(() => {
    if (!channel) {
      logger.debug(LogCategory.COMMUNICATION, 'WebSocket', 'No channel provided');
      return;
    }

    const socket = (channel as any).socket;
    if (!socket) {
      logger.warn(LogCategory.COMMUNICATION, 'WebSocket', 'No socket found in channel');
      return;
    }

    socket.onopen = handleWebSocketOpen;
    socket.onclose = handleWebSocketClose;
    socket.onerror = handleWebSocketError;

    logger.debug(LogCategory.COMMUNICATION, 'WebSocket', 'Event listeners attached', {
      timestamp: new Date().toISOString()
    });

    return () => {
      logger.debug(LogCategory.COMMUNICATION, 'WebSocket', 'Cleaning up event listeners', {
        timestamp: new Date().toISOString()
      });
      socket.onopen = null;
      socket.onclose = null;
      socket.onerror = null;
    };
  }, [channel, handleWebSocketOpen, handleWebSocketClose, handleWebSocketError]);

  return {
    connectionState
  };
};