import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useConnectionState } from '@/contexts/realtime/connectionState';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SubscriptionConfig } from '@/contexts/realtime/types';

export const useSubscriptionManager = () => {
  const { state, updateState } = useConnectionState();
  const activeChannels = useRef<Map<string, RealtimeChannel>>(new Map());

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

    const channel = supabase.channel(channelKey)
      .on('system', { event: '*' }, (payload) => {
        logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'System event', {
          event: payload.event,
          timestamp: new Date().toISOString()
        });
      });

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
      .subscribe((status) => {
        logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription status changed', {
          channelKey,
          status,
          timestamp: new Date().toISOString()
        });
        
        if (status === 'SUBSCRIBED') {
          activeChannels.current.set(channelKey, channel);
          updateState({ 
            status: 'connected',
            retryCount: 0,
            error: undefined
          });
        } else if (status === 'CHANNEL_ERROR') {
          const error = new Error(`Channel error for ${config.table}`);
          updateState({
            status: 'disconnected',
            retryCount: state.retryCount + 1,
            error
          });
          config.onError?.(error);
        }
        
        config.onSubscriptionChange?.(status);
      });

    return channel;
  }, [state.retryCount, updateState]);

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
    subscribe,
    cleanup,
    cleanupSubscription
  };
};