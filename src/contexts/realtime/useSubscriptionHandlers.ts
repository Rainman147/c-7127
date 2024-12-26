import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import { ExponentialBackoff } from '@/utils/backoff';

const backoffConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxAttempts: 5,
  jitter: true
};

export const useSubscriptionHandlers = (
  setLastMessage: (message: Message) => void,
  backoff: React.MutableRefObject<ExponentialBackoff>
) => {
  const handleChatMessage = useCallback((payload: any) => {
    if (payload.new && payload.eventType === 'INSERT') {
      setLastMessage(payload.new as Message);
      backoff.current.reset();
      
      logger.info(LogCategory.WEBSOCKET, 'SubscriptionHandlers', 'New chat message received', {
        messageId: payload.new.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [setLastMessage, backoff]);

  const handleMessageUpdate = useCallback((messageId: string, onUpdate: (content: string) => void) => {
    return (payload: any) => {
      if (payload.new?.content) {
        onUpdate(payload.new.content);
        backoff.current.reset();
        
        logger.info(LogCategory.WEBSOCKET, 'SubscriptionHandlers', 'Message update received', {
          messageId,
          timestamp: new Date().toISOString()
        });
      }
    };
  }, [backoff]);

  return {
    handleChatMessage,
    handleMessageUpdate
  };
};