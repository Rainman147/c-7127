import { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionManager } from '@/hooks/realtime/useSubscriptionManager';
import { ExponentialBackoff } from '@/utils/backoff';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';
import type { RealtimeContextValue } from './realtime/types';

const RealTimeContext = createContext<RealtimeContextValue | undefined>(undefined);

const backoffConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxAttempts: 5,
  jitter: true
};

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const { state: connectionState, subscribe, cleanup } = useSubscriptionManager();
  const [lastMessage, setLastMessage] = useState<Message>();
  
  const chatChannels = useRef(new Map<string, RealtimeChannel>());
  const messageChannels = useRef(new Map<string, RealtimeChannel>());
  const messageCallbacks = useRef(new Map<string, (content: string) => void>());
  const backoff = useRef(new ExponentialBackoff(backoffConfig));
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const handleConnectionError = useCallback((error: Error) => {
    logger.error(LogCategory.WEBSOCKET, 'RealTimeContext', 'Connection error occurred', {
      error: error.message,
      retryCount: backoff.current.attemptCount,
      timestamp: new Date().toISOString()
    });

    const delay = backoff.current.nextDelay();
    
    if (delay !== null) {
      toast({
        title: "Connection Lost",
        description: `Reconnecting... (Attempt ${backoff.current.attemptCount}/${backoffConfig.maxAttempts})`,
        variant: "destructive",
      });

      reconnectTimeoutRef.current = setTimeout(() => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Attempting reconnection', {
          attempt: backoff.current.attemptCount,
          delay,
          timestamp: new Date().toISOString()
        });
        
        // Attempt to resubscribe to all active channels
        Array.from(chatChannels.current.values()).forEach(channel => {
          supabase.removeChannel(channel);
        });
        Array.from(messageChannels.current.values()).forEach(channel => {
          supabase.removeChannel(channel);
        });
        
        chatChannels.current.clear();
        messageChannels.current.clear();
      }, delay);
    } else {
      toast({
        title: "Connection Failed",
        description: "Maximum retry attempts reached. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const subscribeToChat = useCallback((chatId: string) => {
    if (chatChannels.current.has(chatId)) {
      logger.debug(LogCategory.WEBSOCKET, 'RealTimeContext', 'Already subscribed to chat', { chatId });
      return;
    }

    const channel = subscribe({
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`,
      onMessage: (payload: any) => {
        if (payload.new && payload.eventType === 'INSERT') {
          setLastMessage(payload.new as Message);
          backoff.current.reset(); // Reset backoff on successful message
        }
      },
      onError: handleConnectionError
    });

    chatChannels.current.set(chatId, channel);
    
    logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Subscribed to chat', {
      chatId,
      timestamp: new Date().toISOString()
    });
  }, [subscribe, handleConnectionError]);

  const unsubscribeFromChat = useCallback((chatId: string) => {
    const channel = chatChannels.current.get(chatId);
    if (channel) {
      logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Unsubscribing from chat', {
        chatId,
        timestamp: new Date().toISOString()
      });
      
      supabase.removeChannel(channel);
      chatChannels.current.delete(chatId);
    }
  }, []);

  const subscribeToMessage = useCallback((messageId: string, onUpdate: (content: string) => void) => {
    if (messageChannels.current.has(messageId)) {
      logger.debug(LogCategory.WEBSOCKET, 'RealTimeContext', 'Already subscribed to message', { messageId });
      return;
    }

    messageCallbacks.current.set(messageId, onUpdate);
    
    const channel = subscribe({
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `id=eq.${messageId}`,
      onMessage: (payload: any) => {
        const callback = messageCallbacks.current.get(messageId);
        if (callback && payload.new?.content) {
          callback(payload.new.content);
          backoff.current.reset(); // Reset backoff on successful update
        }
      },
      onError: handleConnectionError
    });

    messageChannels.current.set(messageId, channel);
    
    logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Subscribed to message', {
      messageId,
      timestamp: new Date().toISOString()
    });
  }, [subscribe, handleConnectionError]);

  const unsubscribeFromMessage = useCallback((messageId: string) => {
    const channel = messageChannels.current.get(messageId);
    if (channel) {
      logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Unsubscribing from message', {
        messageId,
        timestamp: new Date().toISOString()
      });
      
      supabase.removeChannel(channel);
      messageChannels.current.delete(messageId);
      messageCallbacks.current.delete(messageId);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Clean up all subscriptions
      Array.from(chatChannels.current.values()).forEach(channel => {
        supabase.removeChannel(channel);
      });
      Array.from(messageChannels.current.values()).forEach(channel => {
        supabase.removeChannel(channel);
      });
      
      chatChannels.current.clear();
      messageChannels.current.clear();
      messageCallbacks.current.clear();
      
      logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Cleaned up all subscriptions', {
        timestamp: new Date().toISOString()
      });
    };
  }, [cleanup]);

  const value: RealtimeContextValue = {
    subscribeToChat,
    unsubscribeFromChat,
    subscribeToMessage,
    unsubscribeFromMessage,
    connectionState,
    lastMessage
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};