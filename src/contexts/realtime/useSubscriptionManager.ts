import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';

export const useSubscriptionManager = (
  setLastMessage: (message: Message) => void
) => {
  const channels = useRef(new Map<string, RealtimeChannel>());
  const retryTimeouts = useRef(new Map<string, NodeJS.Timeout>());
  const activeSubscriptions = useRef(new Set<string>());

  const cleanupSubscription = useCallback((chatId: string) => {
    logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Cleaning up subscription:', { 
      chatId,
      timestamp: new Date().toISOString()
    });
    
    const channel = channels.current.get(chatId);
    if (channel) {
      try {
        supabase.removeChannel(channel);
        channels.current.delete(chatId);
        activeSubscriptions.current.delete(chatId);
        
        if (retryTimeouts.current.has(chatId)) {
          clearTimeout(retryTimeouts.current.get(chatId));
          retryTimeouts.current.delete(chatId);
        }

        logger.debug(LogCategory.COMMUNICATION, 'RealTimeContext', 'Successfully cleaned up subscription:', {
          chatId,
          remainingSubscriptions: Array.from(activeSubscriptions.current),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(LogCategory.ERROR, 'RealTimeContext', 'Error cleaning up subscription:', {
          chatId,
          error,
          timestamp: new Date().toISOString()
        });
      }
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
    retryTimeouts.current.clear();
    activeSubscriptions.current.clear();
  }, [cleanupSubscription]);

  return {
    channels,
    retryTimeouts,
    activeSubscriptions,
    cleanupSubscription,
    cleanupAllSubscriptions
  };
};