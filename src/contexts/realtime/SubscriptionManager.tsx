import { RealtimeChannel } from '@supabase/supabase-js';
import { logger, LogCategory } from '@/utils/logging';
import { supabase } from '@/integrations/supabase/client';
import type { SubscriptionConfig } from './types';

export class SubscriptionManager {
  private subscriptions: Map<string, RealtimeChannel>;
  private cleanupTimeouts: Map<string, NodeJS.Timeout>;

  constructor() {
    this.subscriptions = new Map();
    this.cleanupTimeouts = new Map();
  }

  public subscribe(config: SubscriptionConfig): RealtimeChannel {
    const channelKey = `${config.table}-${config.filter || 'all'}`;
    
    if (this.subscriptions.has(channelKey)) {
      this.cleanup(channelKey);
    }

    logger.debug(LogCategory.SUBSCRIPTION, 'SubscriptionManager', 'Creating subscription', {
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
        (payload) => {
          logger.debug(LogCategory.SUBSCRIPTION, 'SubscriptionManager', 'Received message', {
            channelKey,
            event: payload.type,
            timestamp: new Date().toISOString()
          });
          config.onMessage(payload);
        }
      )
      .subscribe((status) => {
        logger.info(LogCategory.SUBSCRIPTION, 'SubscriptionManager', 'Subscription status changed', {
          channelKey,
          status,
          timestamp: new Date().toISOString()
        });
        
        if (status === 'SUBSCRIBED') {
          this.subscriptions.set(channelKey, channel);
          config.onSubscriptionStatus?.('SUBSCRIBED');
        } else if (status === 'CHANNEL_ERROR') {
          const error = new Error(`Channel error for ${config.table}`);
          config.onError?.(error);
          this.cleanup(channelKey);
          config.onSubscriptionStatus?.('CHANNEL_ERROR');
        }
      });

    return channel;
  }

  public cleanup(channelKey?: string): void {
    if (channelKey) {
      const channel = this.subscriptions.get(channelKey);
      if (channel) {
        logger.info(LogCategory.SUBSCRIPTION, 'SubscriptionManager', 'Cleaning up subscription', {
          channelKey,
          timestamp: new Date().toISOString()
        });
        channel.unsubscribe();
        this.subscriptions.delete(channelKey);
      }
    } else {
      logger.info(LogCategory.SUBSCRIPTION, 'SubscriptionManager', 'Cleaning up all subscriptions', {
        count: this.subscriptions.size,
        subscriptionKeys: Array.from(this.subscriptions.keys()),
        timestamp: new Date().toISOString()
      });
      this.subscriptions.forEach((channel, key) => this.cleanup(key));
    }
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}