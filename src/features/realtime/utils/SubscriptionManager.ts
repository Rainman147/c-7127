import { logger, LogCategory } from '@/utils/logging';
import type { SubscriptionConfig } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export class SubscriptionManager {
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  public subscribe(config: SubscriptionConfig): RealtimeChannel {
    logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Creating subscription', {
      event: config.event,
      schema: config.schema,
      table: config.table,
      filter: config.filter,
      timestamp: new Date().toISOString()
    });

    const channelKey = `${config.schema}:${config.table}:${config.event}${config.filter ? `:${config.filter}` : ''}`;
    
    if (this.subscriptions.has(channelKey)) {
      logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Reusing existing subscription', {
        channelKey,
        timestamp: new Date().toISOString()
      });
      return this.subscriptions.get(channelKey)!;
    }

    const channel = supabase.channel(channelKey)
      .on('postgres_changes', {
        event: config.event,
        schema: config.schema,
        table: config.table,
        filter: config.filter
      }, (payload) => {
        try {
          config.onMessage(payload);
        } catch (error) {
          logger.error(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Error in message handler', {
            error,
            channelKey,
            timestamp: new Date().toISOString()
          });
          config.onError?.(error as Error);
        }
      })
      .subscribe((status) => {
        logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription status changed', {
          status,
          channelKey,
          timestamp: new Date().toISOString()
        });
        config.onSubscriptionStatus?.(status);
      });

    this.subscriptions.set(channelKey, channel);
    return channel;
  }

  public cleanup(channelKey?: string) {
    if (channelKey) {
      const channel = this.subscriptions.get(channelKey);
      if (channel) {
        logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up subscription', {
          channelKey,
          timestamp: new Date().toISOString()
        });
        channel.unsubscribe();
        this.subscriptions.delete(channelKey);
      }
    } else {
      logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up all subscriptions', {
        count: this.subscriptions.size,
        timestamp: new Date().toISOString()
      });
      this.subscriptions.forEach(channel => channel.unsubscribe());
      this.subscriptions.clear();
    }
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

export const useSubscriptionManager = () => {
  const manager = new SubscriptionManager();
  
  return {
    subscribe: manager.subscribe.bind(manager),
    cleanup: manager.cleanup.bind(manager),
    getActiveSubscriptions: () => manager.getActiveSubscriptions()
  };
};