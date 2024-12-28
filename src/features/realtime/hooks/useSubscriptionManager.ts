import { useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger, LogCategory } from '@/utils/logging';
import type { SubscriptionConfig } from '../types';
import { supabase } from '@/integrations/supabase/client';

export const useSubscriptionManager = () => {
  const subscriptions = useRef(new Map<string, RealtimeChannel>());
  const activeSubscriptions = useRef(new Set<string>());

  const subscribe = useCallback((config: SubscriptionConfig): RealtimeChannel => {
    const channelKey = `${config.table}-${config.filter || 'all'}`;
    
    if (subscriptions.current.has(channelKey)) {
      const existingChannel = subscriptions.current.get(channelKey)!;
      supabase.removeChannel(existingChannel);
      subscriptions.current.delete(channelKey);
      activeSubscriptions.current.delete(channelKey);
    }

    logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Creating subscription', {
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          subscriptions.current.set(channelKey, channel);
          activeSubscriptions.current.add(channelKey);
        }
        config.onSubscriptionStatus?.(status);
      });

    return channel;
  }, []);

  const cleanup = useCallback((channelKey?: string) => {
    if (channelKey) {
      const channel = subscriptions.current.get(channelKey);
      if (channel) {
        supabase.removeChannel(channel);
        subscriptions.current.delete(channelKey);
        activeSubscriptions.current.delete(channelKey);
      }
    } else {
      subscriptions.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      subscriptions.current.clear();
      activeSubscriptions.current.clear();
    }
  }, []);

  return {
    subscribe,
    cleanup,
    getActiveSubscriptions: () => Array.from(activeSubscriptions.current)
  };
};