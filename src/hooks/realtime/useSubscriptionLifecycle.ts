import { useEffect, useCallback, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { SubscriptionConfig } from '@/contexts/realtime/types';

interface SubscriptionMetrics {
  startTime: number;
  lastEventTime: number;
  eventCount: number;
  errorCount: number;
  reconnectCount: number;
}

export const useSubscriptionLifecycle = (
  channelName: string,
  config: SubscriptionConfig,
  onError?: (error: Error) => void
) => {
  const { toast } = useToast();
  const metricsRef = useRef<SubscriptionMetrics>({
    startTime: Date.now(),
    lastEventTime: Date.now(),
    eventCount: 0,
    errorCount: 0,
    reconnectCount: 0
  });

  const handleSubscriptionEvent = useCallback((payload: any) => {
    metricsRef.current.eventCount++;
    metricsRef.current.lastEventTime = Date.now();

    logger.debug(LogCategory.WEBSOCKET, 'SubscriptionLifecycle', 'Received event', {
      channelName,
      eventType: payload.type,
      timestamp: new Date().toISOString()
    });

    config.onMessage(payload);
  }, [channelName, config]);

  const handleSubscriptionError = useCallback((error: Error) => {
    metricsRef.current.errorCount++;

    logger.error(LogCategory.WEBSOCKET, 'SubscriptionLifecycle', 'Subscription error', {
      channelName,
      error: error.message,
      metrics: metricsRef.current,
      timestamp: new Date().toISOString()
    });

    toast({
      title: "Subscription Error",
      description: "Failed to receive updates. Attempting to reconnect...",
      variant: "destructive",
    });

    onError?.(error);
  }, [channelName, onError, toast]);

  const handleSubscriptionStatus = useCallback((status: string) => {
    if (status === 'SUBSCRIBED') {
      logger.info(LogCategory.WEBSOCKET, 'SubscriptionLifecycle', 'Subscription active', {
        channelName,
        metrics: metricsRef.current,
        timestamp: new Date().toISOString()
      });
    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      metricsRef.current.reconnectCount++;
      
      logger.warn(LogCategory.WEBSOCKET, 'SubscriptionLifecycle', 'Subscription interrupted', {
        channelName,
        status,
        metrics: metricsRef.current,
        timestamp: new Date().toISOString()
      });
    }

    config.onSubscriptionStatus?.(status);
  }, [channelName, config]);

  const getMetrics = useCallback(() => ({
    ...metricsRef.current,
    uptime: Date.now() - metricsRef.current.startTime,
    lastEventAge: Date.now() - metricsRef.current.lastEventTime
  }), []);

  return {
    handleSubscriptionEvent,
    handleSubscriptionError,
    handleSubscriptionStatus,
    getMetrics
  };
};