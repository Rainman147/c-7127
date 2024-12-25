import { useState, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ConnectionState, ConnectionStateUpdate } from '@/types/connection';

const DEFAULT_STATE: ConnectionState = {
  status: 'disconnected',
  retryCount: 0,
  error: null
};

export const useSubscriptionManager = (
  initialState: ConnectionState = DEFAULT_STATE,
  onStateChange?: (state: ConnectionState) => void,
  maxRetries: number = 3
) => {
  const [state, setState] = useState<ConnectionState>(initialState);

  const updateState = useCallback((update: ConnectionStateUpdate) => {
    setState(prev => {
      const newState = { ...prev, ...update };
      logger.debug(LogCategory.STATE, 'SubscriptionManager', 'State updated', {
        previousState: prev,
        newState,
        update,
        timestamp: new Date().toISOString()
      });
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  const subscribe = (channel: RealtimeChannel) => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
      logger.info(LogCategory.COMMUNICATION, 'SubscriptionManager', 'Received message update', {
        payload,
        timestamp: new Date().toISOString()
      });
      updateState({ status: 'connected' });
    });

    channel.on('error', (error) => {
      logger.error(LogCategory.COMMUNICATION, 'SubscriptionManager', 'Subscription error', {
        error,
        timestamp: new Date().toISOString()
      });
      updateState({ status: 'error', error });
    });

    channel.on('disconnected', () => {
      logger.warn(LogCategory.COMMUNICATION, 'SubscriptionManager', 'Disconnected from channel', {
        timestamp: new Date().toISOString()
      });
      updateState({ status: 'disconnected' });
    });

    channel.on('connected', () => {
      logger.info(LogCategory.COMMUNICATION, 'SubscriptionManager', 'Connected to channel', {
        timestamp: new Date().toISOString()
      });
      updateState({ status: 'connected' });
    });

    return () => {
      channel.unsubscribe();
      logger.info(LogCategory.COMMUNICATION, 'SubscriptionManager', 'Unsubscribed from channel', {
        timestamp: new Date().toISOString()
      });
    };
  };

  return {
    state,
    updateState,
    subscribe,
  };
};
