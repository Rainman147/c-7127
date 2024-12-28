import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';
import { SubscriptionManager } from './realtime/SubscriptionManager';
import type { Message } from '@/types/chat';
import type { ConnectionState, RealtimeContextValue, SubscriptionConfig } from './realtime/types';

const RealTimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};

export const RealTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'connecting',
    retryCount: 0,
    lastAttempt: Date.now(),
    error: undefined
  });
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const subscriptionManager = useRef(new SubscriptionManager());

  const subscribeToChat = (chatId: string, componentId: string) => {
    const subscriptionKey = `messages-chat_id=eq.${chatId}`;
    
    logger.info(LogCategory.SUBSCRIPTION, 'RealTimeProvider', 'Subscribing to chat:', {
      chatId,
      componentId
    });

    const config: SubscriptionConfig = {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`,
      onMessage: (payload) => {
        if (payload.new) {
          setLastMessage(payload.new as Message);
        }
      },
      onError: (error) => {
        logger.error(LogCategory.SUBSCRIPTION, 'RealTimeProvider', 'Chat subscription error:', {
          error,
          chatId
        });
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat. Please try again.",
          variant: "destructive",
        });
      },
      onSubscriptionStatus: (status) => {
        logger.info(LogCategory.SUBSCRIPTION, 'RealTimeProvider', 'Chat subscription status:', {
          status,
          chatId
        });
      }
    };

    subscriptionManager.current.subscribe(config);
  };

  const unsubscribeFromChat = (chatId: string, componentId: string) => {
    const subscriptionKey = `messages-chat_id=eq.${chatId}`;
    
    logger.info(LogCategory.SUBSCRIPTION, 'RealTimeProvider', 'Unsubscribing from chat:', {
      chatId,
      componentId
    });
    
    subscriptionManager.current.cleanup(subscriptionKey);
  };

  const subscribeToMessage = (messageId: string, componentId: string, onMessage: (content: string) => void) => {
    const config: SubscriptionConfig = {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `id=eq.${messageId}`,
      onMessage: (payload) => {
        if (payload.new?.content) {
          onMessage(payload.new.content);
        }
      },
      onError: (error) => {
        logger.error(LogCategory.SUBSCRIPTION, 'RealTimeProvider', 'Message subscription error:', {
          error,
          messageId
        });
      },
      onSubscriptionStatus: (status) => {
        logger.info(LogCategory.SUBSCRIPTION, 'RealTimeProvider', 'Message subscription status:', {
          status,
          messageId
        });
      }
    };

    subscriptionManager.current.subscribe(config);
  };

  const unsubscribeFromMessage = (messageId: string, componentId: string) => {
    const subscriptionKey = `messages-id=eq.${messageId}`;
    subscriptionManager.current.cleanup(subscriptionKey);
  };

  const subscribe = (config: SubscriptionConfig) => {
    subscriptionManager.current.subscribe(config);
  };

  const cleanup = () => {
    subscriptionManager.current.cleanup();
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const value: RealtimeContextValue = {
    connectionState,
    lastMessage,
    subscribeToChat,
    unsubscribeFromChat,
    subscribeToMessage,
    unsubscribeFromMessage,
    subscribe,
    cleanup
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};