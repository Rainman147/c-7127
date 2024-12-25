import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';
import type { ConnectionState } from './config';

export const useSubscriptionManager = (
  setLastMessage: (message: Message) => void,
  setConnectionState: (state: ConnectionState | ((prev: ConnectionState) => ConnectionState)) => void,
  handleConnectionError: (chatId: string, error: Error) => void,
  lastMessage?: Message
) => {
  const channels = useRef(new Map<string, RealtimeChannel>());
  const activeSubscriptions = useRef(new Set<string>());

  const processMessage = useCallback((payload: any, chatId: string) => {
    try {
      logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Processing message', { 
        payload,
        chatId,
        eventType: payload.eventType,
        timestamp: new Date().toISOString()
      });
      
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as Message;
        
        if (lastMessage?.id !== newMessage.id) {
          logger.debug(LogCategory.STATE, 'SubscriptionManager', 'Setting new message', {
            messageId: newMessage.id,
            previousMessageId: lastMessage?.id,
            chatId
          });
          setLastMessage(newMessage);
        } else {
          logger.debug(LogCategory.STATE, 'SubscriptionManager', 'Skipping duplicate message', {
            messageId: newMessage.id,
            chatId
          });
        }
      }
    } catch (error) {
      logger.error(LogCategory.ERROR, 'SubscriptionManager', 'Error processing message', {
        error: error instanceof Error ? error.message : String(error),
        chatId,
        timestamp: new Date().toISOString()
      });
      handleConnectionError(chatId, error as Error);
    }
  }, [lastMessage, setLastMessage, handleConnectionError]);

  const cleanupSubscription = useCallback((chatId: string) => {
    logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up subscription', { 
      chatId,
      hasExistingChannel: channels.current.has(chatId),
      timestamp: new Date().toISOString()
    });
    
    const channel = channels.current.get(chatId);
    if (channel) {
      logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Removing channel', {
        chatId,
        channelStatus: channel.state,
        timestamp: new Date().toISOString()
      });
      
      supabase.removeChannel(channel);
      channels.current.delete(chatId);
      activeSubscriptions.current.delete(chatId);
      
      logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Subscription cleanup complete', {
        chatId,
        remainingSubscriptions: Array.from(activeSubscriptions.current),
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  const subscribe = useCallback(({ channelName, filter, onMessage, onError, onSubscriptionChange }: {
    channelName: string;
    filter: {
      event: string;
      schema: string;
      table: string;
      filter?: string;
    };
    onMessage: (payload: any) => void;
    onError?: (error: Error) => void;
    onSubscriptionChange?: (status: string) => void;
  }) => {
    if (channels.current.has(channelName)) {
      logger.warn(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Channel already exists', {
        channelName,
        timestamp: new Date().toISOString()
      });
      return null;
    }

    logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Creating new channel', {
      channelName,
      filter,
      timestamp: new Date().toISOString()
    });

    try {
      const channel = supabase.channel(channelName);
      
      channel
        .on('postgres_changes', filter, (payload) => {
          logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Received postgres change', {
            channelName,
            eventType: payload.eventType,
            timestamp: new Date().toISOString()
          });
          onMessage(payload);
        })
        .on('error', (error: Error) => {
          logger.error(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Channel error', {
            channelName,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          onError?.(error);
        });

      channel.subscribe((status) => {
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

  const cleanupAllSubscriptions = useCallback(() => {
    logger.info(LogCategory.WEBSOCKET, 'SubscriptionManager', 'Cleaning up all subscriptions', {
      subscriptionCount: activeSubscriptions.current.size,
      activeChannels: Array.from(channels.current.keys()),
      timestamp: new Date().toISOString()
    });
    
    channels.current.forEach((_, channelName) => {
      cleanupSubscription(channelName);
    });
    
    channels.current.clear();
    activeSubscriptions.current.clear();
    
    logger.debug(LogCategory.WEBSOCKET, 'SubscriptionManager', 'All subscriptions cleaned up', {
      timestamp: new Date().toISOString()
    });
  }, [cleanupSubscription]);

  return {
    channels,
    activeSubscriptions,
    subscribe,
    cleanupSubscription,
    cleanupAllSubscriptions,
    processMessage
  };
};