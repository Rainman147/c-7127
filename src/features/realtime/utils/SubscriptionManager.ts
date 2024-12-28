import { RealtimeChannel } from '@supabase/supabase-js';
import { logger, LogCategory } from '@/utils/logging';
import { CircuitBreaker } from './CircuitBreaker';
import type { SubscriptionMetrics, ChannelMetrics } from '@/types/realtime/metrics';

export class SubscriptionManager {
  private subscriptions = new Map<string, RealtimeChannel>();
  private metrics = new Map<string, SubscriptionMetrics>();
  private channelMetrics = new Map<string, ChannelMetrics>();
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private subscriptionCache = new Map<string, { timestamp: number, hash: string }>();
  
  private static readonly CACHE_DURATION = 5000; // 5 seconds
  private static readonly MAX_CHANNEL_SUBSCRIPTIONS = 10;

  constructor() {
    this.startMetricsCleanup();
  }

  public async subscribe(
    channelKey: string,
    subscriptionConfig: any
  ): Promise<RealtimeChannel | null> {
    // Deduplication check
    const configHash = JSON.stringify(subscriptionConfig);
    const cached = this.subscriptionCache.get(channelKey);
    
    if (cached && 
        cached.hash === configHash && 
        Date.now() - cached.timestamp < SubscriptionManager.CACHE_DURATION) {
      logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Duplicate subscription prevented', {
        channelKey,
        timeSinceLastAttempt: Date.now() - cached.timestamp
      });
      return this.subscriptions.get(channelKey) || null;
    }

    // Circuit breaker check
    let breaker = this.circuitBreakers.get(channelKey);
    if (!breaker) {
      breaker = new CircuitBreaker();
      this.circuitBreakers.set(channelKey, breaker);
    }

    if (!breaker.canAttempt()) {
      logger.warn(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Circuit breaker preventing subscription', {
        channelKey,
        breakerState: breaker.getState()
      });
      return null;
    }

    // Channel capacity check
    const channelMetrics = this.getChannelMetrics(channelKey);
    if (channelMetrics.activeSubscriptions >= SubscriptionManager.MAX_CHANNEL_SUBSCRIPTIONS) {
      logger.warn(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Channel capacity exceeded', {
        channelKey,
        activeSubscriptions: channelMetrics.activeSubscriptions
      });
      return null;
    }

    try {
      // Create subscription and track metrics
      const startTime = Date.now();
      const channel = await this.createSubscription(channelKey, subscriptionConfig);
      
      this.updateMetrics(channelKey, {
        subscriptionId: channelKey,
        channelId: channelKey,
        startTime,
        lastEventTime: startTime,
        eventCount: 0,
        errorCount: 0,
        reconnectCount: 0,
        latency: []
      });

      // Cache successful subscription
      this.subscriptionCache.set(channelKey, {
        timestamp: Date.now(),
        hash: configHash
      });

      breaker.recordSuccess();
      return channel;
    } catch (error) {
      breaker.recordFailure();
      logger.error(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription failed', {
        channelKey,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  private async createSubscription(
    channelKey: string,
    config: any
  ): Promise<RealtimeChannel> {
    // Implementation of actual subscription creation
    // This would integrate with your existing Supabase setup
    return {} as RealtimeChannel; // Placeholder
  }

  private updateMetrics(channelKey: string, metrics: SubscriptionMetrics): void {
    this.metrics.set(channelKey, metrics);
    
    const channelMetrics = this.getChannelMetrics(channelKey);
    channelMetrics.activeSubscriptions++;
    channelMetrics.lastActive = Date.now();
    this.channelMetrics.set(channelKey, channelMetrics);
  }

  private getChannelMetrics(channelKey: string): ChannelMetrics {
    return this.channelMetrics.get(channelKey) || {
      channelId: channelKey,
      activeSubscriptions: 0,
      totalEvents: 0,
      lastActive: Date.now(),
      status: 'active'
    };
  }

  private startMetricsCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Clean up old cache entries
      for (const [key, value] of this.subscriptionCache.entries()) {
        if (now - value.timestamp > SubscriptionManager.CACHE_DURATION) {
          this.subscriptionCache.delete(key);
        }
      }
      
      // Log metrics
      logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Metrics update', {
        activeSubscriptions: this.subscriptions.size,
        channelMetrics: Array.from(this.channelMetrics.values()),
        timestamp: new Date(now).toISOString()
      });
    }, 30000); // Run every 30 seconds
  }

  public getMetrics(): { subscriptions: SubscriptionMetrics[], channels: ChannelMetrics[] } {
    return {
      subscriptions: Array.from(this.metrics.values()),
      channels: Array.from(this.channelMetrics.values())
    };
  }
}