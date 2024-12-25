import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';

class SubscriptionManager {
  private static instance: SubscriptionManager;
  private channels: Map<string, RealtimeChannel>;

  private constructor() {
    this.channels = new Map();
  }

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  addChannel(key: string, channel: RealtimeChannel): void {
    if (this.channels.has(key)) {
      logger.warn(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Channel already exists', {
        key,
        timestamp: new Date().toISOString()
      });
      return;
    }

    this.channels.set(key, channel);
    logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Added new channel', {
      key,
      timestamp: new Date().toISOString()
    });
  }

  getChannel(key: string): RealtimeChannel | undefined {
    return this.channels.get(key);
  }

  removeChannel(key: string): void {
    const channel = this.channels.get(key);
    if (channel) {
      try {
        supabase.removeChannel(channel);
        this.channels.delete(key);
        logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Removed channel', {
          key,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Error removing channel', {
          key,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  cleanup(): void {
    this.channels.forEach((channel, key) => {
      this.removeChannel(key);
    });
    logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaned up all channels', {
      timestamp: new Date().toISOString()
    });
  }
}

export const subscriptionManager = SubscriptionManager.getInstance();