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
      logger.debug(LogCategory.COMMUNICATION, 'RealTimeContext', 'Received message:', { 
        payload,
        chatId,
        eventType: payload.eventType,
        timestamp: new Date().toISOString()
      });
      
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as Message;
        
        if (lastMessage?.id !== newMessage.id) {
          logger.debug(LogCategory.STATE, 'RealTimeContext', 'Setting new last message:', {
            messageId: newMessage.id,
            previousMessageId: lastMessage?.id
          });
          setLastMessage(newMessage);
        } else {
          logger.debug(LogCategory.STATE, 'RealTimeContext', 'Skipping duplicate message:', {
            messageId: newMessage.id
          });
        }
      }
    } catch (error) {
      handleConnectionError(chatId, error as Error);
    }
  }, [lastMessage, setLastMessage, handleConnectionError]);

  const cleanupSubscription = useCallback((chatId: string) => {
    logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Cleaning up subscription:', { 
      chatId,
      timestamp: new Date().toISOString()
    });
    
    const channel = channels.current.get(chatId);
    if (channel) {
      supabase.removeChannel(channel);
      channels.current.delete(chatId);
      activeSubscriptions.current.delete(chatId);
      
      logger.debug(LogCategory.COMMUNICATION, 'RealTimeContext', 'Successfully cleaned up subscription:', {
        chatId,
        remainingSubscriptions: Array.from(activeSubscriptions.current),
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  const cleanupAllSubscriptions = useCallback(() => {
    logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Cleaning up all subscriptions', {
      subscriptionCount: activeSubscriptions.current.size,
      timestamp: new Date().toISOString()
    });
    
    channels.current.forEach((_, chatId) => {
      cleanupSubscription(chatId);
    });
    
    channels.current.clear();
    activeSubscriptions.current.clear();
  }, [cleanupSubscription]);

  return {
    channels,
    activeSubscriptions,
    cleanupSubscription,
    cleanupAllSubscriptions,
    processMessage
  };
};