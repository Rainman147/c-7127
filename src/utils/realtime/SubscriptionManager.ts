import { logger, LogCategory } from '@/utils/logging';
import type { RealtimeChannel } from '@supabase/supabase-js';

export class SubscriptionManager {
  private subscriptions: Map<string, RealtimeChannel>;
  private cleanupTimeouts: Map<string, NodeJS.Timeout>;

  constructor() {
    this.subscriptions = new Map();
    this.cleanupTimeouts = new Map();
  }

  public addSubscription(key: string, channel: RealtimeChannel): void {
    this.subscriptions.set(key, channel);
    logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Added subscription', {
      key,
      activeSubscriptions: this.subscriptions.size,
      timestamp: new Date().toISOString()
    });
  }

  public removeSubscription(key: string): void {
    const channel = this.subscriptions.get(key);
    if (channel) {
      logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Removing subscription', {
        key,
        timestamp: new Date().toISOString()
      });
      channel.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  public cleanupSubscriptions(): void {
    logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up all subscriptions', {
      count: this.subscriptions.size,
      subscriptionKeys: Array.from(this.subscriptions.keys()),
      timestamp: new Date().toISOString()
    });

    this.subscriptions.forEach((channel, key) => {
      this.removeSubscription(key);
    });
  }

  public scheduleCleanup(key: string, delay: number): void {
    const existingTimeout = this.cleanupTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      this.removeSubscription(key);
      this.cleanupTimeouts.delete(key);
    }, delay);

    this.cleanupTimeouts.set(key, timeout);
  }

  public cancelScheduledCleanup(key: string): void {
    const timeout = this.cleanupTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.cleanupTimeouts.delete(key);
    }
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}