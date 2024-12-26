import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ConnectionState, ConnectionStatus, SubscriptionConfig } from '@/contexts/realtime/types';

export const useSubscriptionManager = () => {
  const [state, setState] = useState<ConnectionState>({
    status: 'disconnected',
    retryCount: 0,
    error: null,
    lastAttempt: Date.now()
  });
  const activeChannels = useRef<Map<string, RealtimeChannel>>(new Map());

  const updateState = useCallback((newState: Partial<ConnectionState>) => {
    setState(prev => ({
      ...prev,
      ...newState,
      lastAttempt: Date.now()
    }));
  }, []);

  const subscribe = useCallback((config: SubscriptionConfig): RealtimeChannel => {
    const channelKey = `${config.table}-${config.filter || 'all'}`;
    
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
        (payload: any) => {
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
            status: 'connected' as ConnectionStatus,
            retryCount: 0,
            error: null
          });
        } else if (status === 'CHANNEL_ERROR') {
          updateState({
            status: 'disconnected' as ConnectionStatus,
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