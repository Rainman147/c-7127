import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';
import type { ConnectionState, ConnectionStateUpdate } from '@/types/connection';

interface SubscriptionConfig {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema: string;
  table: string;
  filter?: string;
  onMessage: (payload: RealtimePostgresChangesPayload<any>) => void;
  onError?: (error: Error) => void;
  onSubscriptionChange?: (status: string) => void;
}

export const useSubscriptionManager = () => {
  const [state, setState] = useState<ConnectionState>({
    status: 'disconnected',
    retryCount: 0,
    error: null
  });

  const updateState = useCallback((update: ConnectionStateUpdate) => {
    setState(prev => ({ ...prev, ...update }));
  }, []);

  const subscribe = useCallback((config: SubscriptionConfig): RealtimeChannel => {
    logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Creating subscription', {
      table: config.table,
      filter: config.filter,
      timestamp: new Date().toISOString()
    });

    const channel = supabase.channel('realtime-subscription');

    channel
      .on(
        'postgres_changes',
        {
          event: config.event,
          schema: config.schema,
          table: config.table,
          filter: config.filter
        },
        (payload) => {
          logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Received message', {
            table: config.table,
            payload,
            timestamp: new Date().toISOString()
          });
          config.onMessage(payload);
        }
      )
      .on('error', (error: Error) => {
        logger.error(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription error', {
          table: config.table,
          error,
          timestamp: new Date().toISOString()
        });
        config.onError?.(error);
      })
      .subscribe((status) => {
        logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription status changed', {
          table: config.table,
          status,
          timestamp: new Date().toISOString()
        });
        config.onSubscriptionChange?.(status);
      });

    return channel;
  }, []);

  const cleanupSubscription = useCallback((channel: RealtimeChannel) => {
    logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up subscription', {
      timestamp: new Date().toISOString()
    });
    
    if (channel) {
      supabase.removeChannel(channel);
    }
  }, []);

  return {
    state,
    updateState,
    subscribe,
    cleanupSubscription
  };
};