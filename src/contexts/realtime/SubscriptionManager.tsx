import { useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { SubscriptionConfig } from './types';
import type { SubscriptionError } from './types/errors';

export const useSubscriptionManager = () => {
  const subscriptions = useRef(new Map<string, RealtimeChannel>());
  const subscriptionTimers = useRef(new Map<string, NodeJS.Timeout>());
  const subscriptionMetrics = useRef(new Map<string, {
    createdAt: number;
    lastEventAt: number;
    errorCount: number;
    reconnectCount: number;
  }>());

  const cleanupChannel = useCallback((channelKey: string) => {
    const channel = subscriptions.current.get(channelKey);
    if (channel) {
      logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up channel', {
        channelKey,
        metrics: subscriptionMetrics.current.get(channelKey),
        timestamp: new Date().toISOString()
      });
      
      supabase.removeChannel(channel);
      subscriptions.current.delete(channelKey);
      subscriptionMetrics.current.delete(channelKey);
      
      const timer = subscriptionTimers.current.get(channelKey);
      if (timer) {
        clearTimeout(timer);
        subscriptionTimers.current.delete(channelKey);
      }
    }
  }, []);

  const subscribe = useCallback((config: SubscriptionConfig): RealtimeChannel => {
    const channelKey = `${config.table}-${config.filter || 'all'}`;
    
    if (subscriptions.current.has(channelKey)) {
      logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up existing subscription', {
        channelKey,
        metrics: subscriptionMetrics.current.get(channelKey),
        timestamp: new Date().toISOString()
      });
      cleanupChannel(channelKey);
    }

    logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Creating new subscription', {
      channelKey,
      table: config.table,
      filter: config.filter,
      timestamp: new Date().toISOString()
    });

    const channel = supabase.channel(channelKey);
    const metrics = {
      createdAt: Date.now(),
      lastEventAt: Date.now(),
      errorCount: 0,
      reconnectCount: 0
    };
    subscriptionMetrics.current.set(channelKey, metrics);

    channel
      .on(
        'postgres_changes' as any,
        { 
          event: config.event,
          schema: config.schema,
          table: config.table,
          filter: config.filter 
        },
        (payload) => {
          logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Received message', {
            channelKey,
            eventType: payload.eventType,
            timestamp: new Date().toISOString()
          });
          metrics.lastEventAt = Date.now();
          config.onMessage(payload);
        }
      )
      .subscribe((status) => {
        logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription status changed', {
          channelKey,
          status,
          metrics: subscriptionMetrics.current.get(channelKey),
          timestamp: new Date().toISOString()
        });
        
        if (status === 'SUBSCRIBED') {
          subscriptions.current.set(channelKey, channel);
        } else if (status === 'CHANNEL_ERROR') {
          metrics.errorCount++;
          const subscriptionError: SubscriptionError = {
            channelId: channelKey,
            event: 'error',
            timestamp: new Date().toISOString(),
            connectionState: 'error',
            retryCount: metrics.errorCount,
            lastAttempt: Date.now(),
            backoffDelay: Math.min(1000 * Math.pow(2, metrics.errorCount), 30000),
            reason: `Channel error for ${config.table}`,
            name: 'ChannelError',
            message: `Subscription error for channel ${channelKey}`
          };
          config.onError?.(subscriptionError);
        } else if (status === 'CLOSED') {
          metrics.reconnectCount++;
        }
        
        config.onSubscriptionStatus?.(status);
      });

    return channel;
  }, [cleanupChannel]);

  const cleanup = useCallback(() => {
    logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up all subscriptions', {
      activeSubscriptions: Array.from(subscriptionMetrics.current.entries()).map(([key, metrics]) => ({
        channelKey: key,
        metrics
      })),
      timestamp: new Date().toISOString()
    });
    
    subscriptions.current.forEach((_, key) => cleanupChannel(key));
  }, [cleanupChannel]);

  return {
    subscribe,
    cleanup,
    getMetrics: () => Array.from(subscriptionMetrics.current.entries()),
    getActiveSubscriptionCount: () => subscriptions.current.size
  };
};