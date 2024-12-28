import { useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { SubscriptionConfig } from './types';
import type { SubscriptionError } from './types/errors';

interface SubscriptionMetrics {
  createdAt: number;
  lastEventAt: number;
  errorCount: number;
  reconnectCount: number;
}

export const useSubscriptionManager = () => {
  const subscriptions = useRef(new Map<string, RealtimeChannel>());
  const subscriptionTimers = useRef(new Map<string, NodeJS.Timeout>());
  const subscriptionMetrics = useRef(new Map<string, SubscriptionMetrics>());

  const cleanupChannel = useCallback((channelKey: string) => {
    const channel = subscriptions.current.get(channelKey);
    if (channel) {
      logger.info(LogCategory.SUBSCRIPTION, 'SubscriptionManager', 'Cleaning up channel', {
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
    const startTime = Date.now();
    
    if (subscriptions.current.has(channelKey)) {
      cleanupChannel(channelKey);
    }

    const channel = supabase.channel(channelKey);
    const metrics = {
      createdAt: startTime,
      lastEventAt: startTime,
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
        (payload: any) => {
          logger.debug(LogCategory.SUBSCRIPTION, 'SubscriptionManager', 'Received message', {
            channelKey,
            event: payload.type,
            timestamp: new Date().toISOString(),
            timeSinceLastEvent: Date.now() - metrics.lastEventAt
          });
          metrics.lastEventAt = Date.now();
          config.onMessage(payload);
        }
      )
      .subscribe((status) => {
        logger.info(LogCategory.SUBSCRIPTION, 'SubscriptionManager', 'Subscription status changed', {
          channelKey,
          status,
          metrics: subscriptionMetrics.current.get(channelKey),
          timestamp: new Date().toISOString()
        });
        
        if (status === 'SUBSCRIBED') {
          subscriptions.current.set(channelKey, channel);
        } else if (status === 'CHANNEL_ERROR') {
          metrics.errorCount++;
          const error: SubscriptionError = {
            channelId: channelKey,
            event: 'error',
            name: 'ChannelError',
            message: `Channel error for ${config.table}`,
            timestamp: new Date().toISOString(),
            connectionState: 'error',
            retryCount: metrics.errorCount,
            lastAttempt: Date.now(),
            backoffDelay: Math.min(1000 * Math.pow(2, metrics.errorCount), 30000),
            reason: `Channel error for ${config.table}`
          };
          logger.error(LogCategory.SUBSCRIPTION, 'SubscriptionManager', 'Subscription error', {
            error,
            channelKey,
            metrics,
            timestamp: new Date().toISOString()
          });
          config.onError?.(new Error(error.message));
        }
        
        config.onSubscriptionStatus?.(status);
      });

    return channel;
  }, [cleanupChannel]);

  return {
    subscribe,
    cleanup: cleanupChannel,
    getActiveSubscriptions: () => Array.from(subscriptions.current.keys()),
    getMetrics: () => Array.from(subscriptionMetrics.current.entries())
  };
};