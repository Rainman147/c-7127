import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';
import type { ConnectionState } from './config';

// Global channel registry
const globalChannels = new Map<string, RealtimeChannel>();

export const useSubscriptionManager = (
  setLastMessage?: (message: Message) => void,
  setConnectionState?: (state: ConnectionState | ((prev: ConnectionState) => ConnectionState)) => void,
  handleConnectionError?: (chatId: string, error: Error) => void
) => {
  const channels = useRef(globalChannels);
  const activeSubscriptions = useRef(new Set<string>());

  const processMessage = useCallback((payload: RealtimePostgresChangesPayload<any>, chatId: string) => {
    try {
      logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Processing message', { 
        payload,
        chatId,
        eventType: payload.eventType,
        timestamp: new Date().toISOString()
      });
      
      if (payload.eventType === 'INSERT' && setLastMessage) {
        const newMessage = payload.new as Message;
        setLastMessage(newMessage);
      }
    } catch (error) {
      logger.error(LogCategory.ERROR, 'SubscriptionManager', 'Error processing message', {
        error: error instanceof Error ? error.message : String(error),
        chatId,
        timestamp: new Date().toISOString()
      });
      handleConnectionError?.(chatId, error as Error);
    }
  }, [setLastMessage, handleConnectionError]);

  const cleanupSubscription = useCallback((channelName: string) => {
    logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up subscription', { 
      channelName,
      hasExistingChannel: channels.current.has(channelName),
      timestamp: new Date().toISOString()
    });
    
    const channel = channels.current.get(channelName);
    if (channel) {
      supabase.removeChannel(channel)
        .then(() => {
          channels.current.delete(channelName);
          activeSubscriptions.current.delete(channelName);
          logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription cleanup complete', {
            channelName,
            remainingSubscriptions: Array.from(activeSubscriptions.current),
            timestamp: new Date().toISOString()
          });
        })
        .catch(error => {
          logger.error(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Error cleaning up subscription', {
            channelName,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          });
        });
    }
  }, []);

  const subscribe = useCallback(({ 
    channelName, 
    filter, 
    onMessage, 
    onError, 
    onSubscriptionChange 
  }: {
    channelName: string;
    filter: {
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema: string;
      table: string;
      filter?: string;
    };
    onMessage: (payload: any) => void;
    onError?: (error: Error) => void;
    onSubscriptionChange?: (status: string) => void;
  }): RealtimeChannel => {
    // Check if channel already exists
    if (channels.current.has(channelName)) {
      logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Reusing existing channel', {
        channelName,
        timestamp: new Date().toISOString()
      });
      return channels.current.get(channelName)!;
    }

    logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Creating new channel', {
      channelName,
      filter,
      timestamp: new Date().toISOString()
    });

    try {
      const channel = supabase.channel(channelName);
      
      channel
        .on(
          'postgres_changes',
          filter,
          (payload: RealtimePostgresChangesPayload<any>) => {
            logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Received postgres change', {
              channelName,
              eventType: payload.eventType,
              timestamp: new Date().toISOString()
            });
            onMessage(payload);
          }
        )
        .on('error', (error: Error) => {
          logger.error(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Channel error', {
            channelName,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          onError?.(error);
        })
        .subscribe((status) => {
          logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription status changed', {
            channelName,
            status,
            timestamp: new Date().toISOString()
          });

          if (status === 'SUBSCRIBED') {
            channels.current.set(channelName, channel);
            activeSubscriptions.current.add(channelName);
          }

          onSubscriptionChange?.(status);
        });

      return channel;
    } catch (error) {
      logger.error(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Failed to create channel', {
        channelName,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, []);

  return {
    channels,
    activeSubscriptions,
    subscribe,
    cleanupSubscription,
    processMessage
  };
};