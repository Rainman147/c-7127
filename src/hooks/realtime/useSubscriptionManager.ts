import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
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
  const activeChannels = useRef<Map<string, RealtimeChannel>>(new Map());

  const updateState = useCallback((update: ConnectionStateUpdate) => {
    setState(prev => ({ ...prev, ...update }));
  }, []);

  const subscribe = useCallback((config: SubscriptionConfig): RealtimeChannel => {
    const channelKey = `${config.table}-${config.filter || 'all'}`;
    
    // Clean up existing subscription if it exists
    if (activeChannels.current.has(channelKey)) {
      const existingChannel = activeChannels.current.get(channelKey);
      if (existingChannel) {
        logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Removing existing channel', {
          channelKey,
          timestamp: new Date().toISOString()
        });
        supabase.removeChannel(existingChannel);
        activeChannels.current.delete(channelKey);
      }
    }

    logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Creating new channel', {
      channelKey,
      timestamp: new Date().toISOString()
    });

    const channel = supabase.channel(channelKey);

    channel
      .on(
        'postgres_changes',
        {
          event: config.event,
          schema: config.schema,
          table: config.table,
          filter: config.filter
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Received message', {
            table: config.table,
            payload,
            timestamp: new Date().toISOString()
          });
          config.onMessage(payload);
        }
      )
      .subscribe((status) => {
        logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription status changed', {
          table: config.table,
          status,
          timestamp: new Date().toISOString()
        });
        
        if (status === 'SUBSCRIBED') {
          activeChannels.current.set(channelKey, channel);
          updateState({
            status: 'connected',
            retryCount: 0,
            error: null
          });
        } else if (status === 'CHANNEL_ERROR') {
          updateState({
            status: 'error',
            error: new Error(`Channel error for ${config.table}`)
          });
          config.onError?.(new Error(`Channel error for ${config.table}`));
        }
        
        config.onSubscriptionChange?.(status);
      });

    return channel;
  }, [updateState]);

  const cleanupSubscription = useCallback((channel: RealtimeChannel) => {
    logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up channel');
    supabase.removeChannel(channel);
  }, []);

  const cleanup = useCallback(() => {
    activeChannels.current.forEach((channel, key) => {
      logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up channel', {
        channelKey: key,
        timestamp: new Date().toISOString()
      });
      supabase.removeChannel(channel);
    });
    activeChannels.current.clear();
  }, []);

  return {
    state,
    updateState,
    subscribe,
    cleanup,
    cleanupSubscription
  };
};