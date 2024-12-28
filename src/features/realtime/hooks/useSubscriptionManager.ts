import { useCallback, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SubscriptionConfig, SubscriptionHandler } from '../types';
import { logger, LogCategory } from '@/utils/logging';

export const useSubscriptionManager = (
  channel: RealtimeChannel | null,
  config: SubscriptionConfig,
  handler: SubscriptionHandler
) => {
  const subscription = useRef<RealtimeChannel | null>(null);

  const subscribe = useCallback(() => {
    if (!channel) return;

    try {
      subscription.current = channel
        .on(config.event, 
            { 
              event: '*', 
              schema: config.schema, 
              table: config.table,
              filter: config.filter 
            }, 
            handler
        );

      logger.debug(LogCategory.STATE, 'SubscriptionManager', 'Subscribed to channel:', {
        event: config.event,
        schema: config.schema,
        table: config.table
      });
    } catch (error) {
      logger.error(LogCategory.STATE, 'SubscriptionManager', 'Error subscribing to channel:', error);
    }
  }, [channel, config, handler]);

  useEffect(() => {
    subscribe();
    return () => {
      if (subscription.current) {
        subscription.current.unsubscribe();
        logger.debug(LogCategory.STATE, 'SubscriptionManager', 'Unsubscribed from channel');
      }
    };
  }, [subscribe]);

  return subscription.current;
};