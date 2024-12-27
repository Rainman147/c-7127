import { useState, useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { SubscriptionMetrics, ChannelMetrics } from '@/types/realtime/metrics';

export const useSubscriptionMetrics = (subscriptionManager: any) => {
  const [metrics, setMetrics] = useState<{
    subscriptions: SubscriptionMetrics[];
    channels: ChannelMetrics[];
  }>({ subscriptions: [], channels: [] });

  useEffect(() => {
    const interval = setInterval(() => {
      const currentMetrics = subscriptionManager.getMetrics();
      setMetrics(currentMetrics);

      logger.debug(LogCategory.WEBSOCKET, 'SubscriptionMetrics', 'Metrics updated', {
        activeSubscriptions: currentMetrics.subscriptions.length,
        activeChannels: currentMetrics.channels.length,
        timestamp: new Date().toISOString()
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [subscriptionManager]);

  return metrics;
};