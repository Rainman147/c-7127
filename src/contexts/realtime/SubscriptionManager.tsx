import { useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger, LogCategory } from '@/utils/logging';
import type { SubscriptionError } from './types/errors';
import type { SubscriptionConfig } from './types';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionConfig {
  channelKey: string;
  channel: RealtimeChannel;
  onError: (error: SubscriptionError) => void;
}

export const useSubscriptionManager = () => {
  const subscriptions = useRef(new Map<string, RealtimeChannel>());
  const subscriptionTimers = useRef(new Map<string, NodeJS.Timeout>());

  const subscribe = useCallback((config: SubscriptionConfig): RealtimeChannel => {
    const channelKey = `${config.table}-${config.filter || 'all'}`;
    
    logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Creating new subscription', {
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
        logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription status changed', {
          channelKey,
          status,
          timestamp: new Date().toISOString()
        });
        
        if (status === 'SUBSCRIBED') {
          subscriptions.current.set(channelKey, channel);
        } else if (status === 'CHANNEL_ERROR') {
          config.onError?.(new Error(`Channel error for ${config.table}`));
        }
      });

    return channel;
  }, []);

  const addSubscription = useCallback(({ channelKey, channel, onError }: SubscriptionConfig) => {
    if (subscriptions.current.has(channelKey)) {
      logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription already exists', {
        channelKey,
        timestamp: new Date().toISOString()
      });
      return;
    }

    channel.subscribe((status) => {
      logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription status changed', {
        channelKey,
        status,
        timestamp: new Date().toISOString()
      });

      if (status === 'CHANNEL_ERROR') {
        const error: SubscriptionError = {
          channelId: channelKey,
          event: status,
          timestamp: new Date().toISOString(),
          connectionState: 'error',
          retryCount: 0
        };
        onError(error);
      }
    });

    subscriptions.current.set(channelKey, channel);
  }, []);

  const removeSubscription = useCallback((channelKey: string) => {
    const channel = subscriptions.current.get(channelKey);
    if (channel) {
      channel.unsubscribe();
      subscriptions.current.delete(channelKey);
      
      const timer = subscriptionTimers.current.get(channelKey);
      if (timer) {
        clearTimeout(timer);
        subscriptionTimers.current.delete(channelKey);
      }

      logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription removed', {
        channelKey,
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  const cleanup = useCallback(() => {
    subscriptions.current.forEach((_, key) => removeSubscription(key));
  }, [removeSubscription]);

  return {
    subscribe,
    addSubscription,
    removeSubscription,
    cleanup,
    getActiveSubscriptions: () => Array.from(subscriptions.current.keys())
  };
};