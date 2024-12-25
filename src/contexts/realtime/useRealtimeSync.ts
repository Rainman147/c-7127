import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, wsLogger, LogCategory } from '@/utils/logging';
import { useWebSocketHealth } from './useWebSocketHealth';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ConnectionState } from './config';

export const useRealtimeSync = (
  connectionState: ConnectionState,
  updateConnectionState: (state: Partial<ConnectionState>) => void
) => {
  const channelRef = useRef<RealtimeChannel>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const handleHealthCheckFailed = useCallback(() => {
    logger.error(LogCategory.WEBSOCKET, 'RealtimeSync', 'Health check failed, initiating reconnect');
    updateConnectionState({
      status: 'disconnected',
      retryCount: connectionState.retryCount + 1
    });
  }, [connectionState.retryCount, updateConnectionState]);

  const { lastPongTime } = useWebSocketHealth(channelRef.current, handleHealthCheckFailed);

  const setupChannel = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel('connection-monitor');
    channelRef.current = channel;

    wsLogger.connectionStateChange('RealtimeSync', 'setup', 'initializing', {
      retryCount: connectionState.retryCount
    });

    channel.subscribe(async (status) => {
      wsLogger.connectionStateChange('RealtimeSync', 'status', status, {
        retryCount: connectionState.retryCount,
        lastPongTime
      });

      if (status === 'SUBSCRIBED') {
        updateConnectionState({
          status: 'connected',
          retryCount: 0,
          error: undefined
        });
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        updateConnectionState({
          status: 'disconnected',
          error: new Error(`Channel ${status}`)
        });
      }
    });
  }, [connectionState.retryCount, lastPongTime, updateConnectionState]);

  useEffect(() => {
    setupChannel();

    return () => {
      if (channelRef.current) {
        wsLogger.connectionStateChange('RealtimeSync', 'cleanup', 'removing-channel');
        supabase.removeChannel(channelRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [setupChannel]);

  return {
    currentChannel: channelRef.current
  };
};