import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';
import type { ConnectionState, ConnectionStateUpdate } from '@/types/connection';

interface SubscriptionConfig {
  channelName: string;
  filter: {
    event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
    schema: string;
    table: string;
    filter?: string;
  };
  onMessage: (payload: any) => void;
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
      channelName: config.channelName,
      filter: config.filter,
      timestamp: new Date().toISOString()
    });

    const channel = supabase.channel(config.channelName);

    channel
      .on(
        'postgres_changes',
        config.filter,
        (payload) => {
          logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Received message', {
            channelName: config.channelName,
            payload,
            timestamp: new Date().toISOString()
          });
          config.onMessage(payload);
        }
      )
      .on('error', (error) => {
        logger.error(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription error', {
          channelName: config.channelName,
          error,
          timestamp: new Date().toISOString()
        });
        config.onError?.(error);
      })
      .subscribe((status) => {
        logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription status changed', {
          channelName: config.channelName,
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