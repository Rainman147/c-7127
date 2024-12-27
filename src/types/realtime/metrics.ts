export interface SubscriptionMetrics {
  subscriptionId: string;
  channelId: string;
  startTime: number;
  lastEventTime: number;
  eventCount: number;
  errorCount: number;
  reconnectCount: number;
  latency: number[];
}

export interface ChannelMetrics {
  channelId: string;
  activeSubscriptions: number;
  totalEvents: number;
  lastActive: number;
  status: 'active' | 'throttled' | 'circuit-open';
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenTimeout: number;
}