import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SubscriptionConfig } from './types';

export const useSubscriptionManager = () => {
  const channels = useRef(new Map<string, RealtimeChannel>());
  const activeSubscriptions = useRef(new Set<string>());

  const subscribe = useCallback((config: SubscriptionConfig): RealtimeChannel => {
    const channelKey = `${config.table}-${config.filter || 'all'}`;
    
    if (channels.current.has(channelKey)) {
      const existingChannel = channels.current.get(channelKey);
      if (existingChannel) {
        logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Removing existing channel', {
          channelKey,
          timestamp: new Date().toISOString()
        });
        supabase.removeChannel(existingChannel);
        channels.current.delete(channelKey);
      }
    }

    const channel = supabase.channel(channelKey)
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
            event: config.event,
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
          channels.current.set(channelKey, channel);
          activeSubscriptions.current.add(channelKey);
        }
        
        config.onSubscriptionStatus?.(status);
      });

    return channel;
  }, []);

  const cleanup = useCallback((channelKey?: string) => {
    if (channelKey) {
      const channel = channels.current.get(channelKey);
      if (channel) {
        supabase.removeChannel(channel);
        channels.current.delete(channelKey);
        activeSubscriptions.current.delete(channelKey);
        
        logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaned up channel', {
          channelKey,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      channels.current.forEach((channel, key) => {
        supabase.removeChannel(channel);
        logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaned up channel', {
          channelKey: key,
          timestamp: new Date().toISOString()
        });
      });
      channels.current.clear();
      activeSubscriptions.current.clear();
    }
  }, []);

  return {
    subscribe,
    cleanup,
    activeSubscriptions: activeSubscriptions.current
  };
};