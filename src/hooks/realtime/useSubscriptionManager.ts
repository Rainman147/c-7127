import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface SubscriptionConfig {
  channelName: string;
  filter?: {
    event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
    schema?: string;
    table?: string;
    filter?: string;
  };
  onMessage?: (payload: any) => void;
  onError?: (error: Error) => void;
  onSubscriptionChange?: (status: string) => void;
}

export const useSubscriptionManager = () => {
  const activeChannels = useRef<Map<string, RealtimeChannel>>(new Map());
  const subscriptionTimes = useRef<Map<string, number>>(new Map());

  const cleanup = useCallback((channelName: string) => {
    const channel = activeChannels.current.get(channelName);
    if (channel) {
      const startTime = subscriptionTimes.current.get(channelName) || Date.now();
      const duration = Date.now() - startTime;

      logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up subscription', {
        channelName,
        duration,
        timestamp: new Date().toISOString()
      });

      supabase.removeChannel(channel);
      activeChannels.current.delete(channelName);
      subscriptionTimes.current.delete(channelName);
    }
  }, []);

  const cleanupAll = useCallback(() => {
    logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up all subscriptions', {
      activeCount: activeChannels.current.size,
      timestamp: new Date().toISOString()
    });

    activeChannels.current.forEach((_, channelName) => cleanup(channelName));
  }, [cleanup]);

  const subscribe = useCallback(({
    channelName,
    filter,
    onMessage,
    onError,
    onSubscriptionChange
  }: SubscriptionConfig) => {
    // Clean up existing subscription if it exists
    cleanup(channelName);

    logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Setting up subscription', {
      channelName,
      filter,
      timestamp: new Date().toISOString()
    });

    try {
      const channel = supabase.channel(channelName);
      activeChannels.current.set(channelName, channel);
      subscriptionTimes.current.set(channelName, Date.now());

      if (filter) {
        channel.on('postgres_changes', filter, (payload) => {
          logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Received message', {
            channelName,
            payload,
            latency: Date.now() - (subscriptionTimes.current.get(channelName) || Date.now()),
            timestamp: new Date().toISOString()
          });
          onMessage?.(payload);
        });
      }

      channel.subscribe((status) => {
        logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription status changed', {
          channelName,
          status,
          timestamp: new Date().toISOString()
        });

        if (status === 'SUBSCRIBED') {
          subscriptionTimes.current.set(channelName, Date.now());
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          const error = new Error(`Channel ${status} for ${channelName}`);
          onError?.(error);
        }

        onSubscriptionChange?.(status);
      });

      return channel;
    } catch (error) {
      logger.error(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Failed to setup subscription', {
        channelName,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      onError?.(error as Error);
      return null;
    }
  }, [cleanup]);

  return {
    subscribe,
    cleanup,
    cleanupAll,
    getActiveChannels: () => Array.from(activeChannels.current.keys())
  };
};