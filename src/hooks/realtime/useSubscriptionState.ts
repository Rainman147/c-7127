import { useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { SubscriptionConfig } from '@/contexts/realtime/types';

export const useSubscriptionState = () => {
  const channels = useRef(new Map<string, RealtimeChannel>());
  const activeSubscriptions = useRef(new Set<string>());
  const subscriptionTimers = useRef(new Map<string, NodeJS.Timeout>());

  const cleanupChannel = useCallback((channelKey: string) => {
    const channel = channels.current.get(channelKey);
    if (channel) {
      logger.info(LogCategory.WEBSOCKET, 'SubscriptionState', 'Cleaning up channel', {
        channelKey,
        timestamp: new Date().toISOString()
      });
      
      supabase.removeChannel(channel);
      channels.current.delete(channelKey);
      activeSubscriptions.current.delete(channelKey);
      
      const timer = subscriptionTimers.current.get(channelKey);
      if (timer) {
        clearTimeout(timer);
        subscriptionTimers.current.delete(channelKey);
      }
    }
  }, []);

  const subscribe = useCallback((config: SubscriptionConfig): RealtimeChannel => {
    const channelKey = `${config.table}-${config.filter || 'all'}`;
    
    if (channels.current.has(channelKey)) {
      cleanupChannel(channelKey);
    }

    logger.debug(LogCategory.WEBSOCKET, 'SubscriptionState', 'Creating new subscription', {
      channelKey,
      table: config.table,
      filter: config.filter,
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
        config.onMessage
      )
      .subscribe(async (status) => {
        logger.info(LogCategory.WEBSOCKET, 'SubscriptionState', 'Subscription status changed', {
          channelKey,
          status,
          timestamp: new Date().toISOString()
        });
        
        if (status === 'SUBSCRIBED') {
          channels.current.set(channelKey, channel);
          activeSubscriptions.current.add(channelKey);
        } else if (status === 'CHANNEL_ERROR') {
          config.onError?.(new Error(`Channel error for ${config.table}`));
          cleanupChannel(channelKey);
        }
        
        config.onSubscriptionStatus?.(status);
      });

    return channel;
  }, [cleanupChannel]);

  const cleanup = useCallback((channelKey?: string) => {
    if (channelKey) {
      cleanupChannel(channelKey);
    } else {
      channels.current.forEach((_, key) => cleanupChannel(key));
    }
  }, [cleanupChannel]);

  return {
    subscribe,
    cleanup,
    activeSubscriptions: activeSubscriptions.current,
    getActiveSubscriptionCount: () => activeSubscriptions.current.size
  };
};