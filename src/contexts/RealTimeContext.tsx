import { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionManager } from '@/hooks/realtime/useSubscriptionManager';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';
import type { RealtimeContextValue } from './realtime/types';

const RealTimeContext = createContext<RealtimeContextValue | undefined>(undefined);

const RETRY_DELAY = 1000;
const MAX_RETRIES = 5;

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const { state: connectionState, updateState, subscribe, cleanup } = useSubscriptionManager();
  const [lastMessage, setLastMessage] = useState<Message>();
  
  const chatChannels = useRef(new Map<string, RealtimeChannel>());
  const messageChannels = useRef(new Map<string, RealtimeChannel>());
  const messageCallbacks = useRef(new Map<string, (content: string) => void>());
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const handleConnectionError = useCallback(() => {
    logger.error(LogCategory.WEBSOCKET, 'RealTimeContext', 'Connection error occurred', {
      retryCount: connectionState.retryCount,
      timestamp: new Date().toISOString()
    });

    if (connectionState.retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, connectionState.retryCount);
      
      updateState({
        status: 'disconnected',
        retryCount: connectionState.retryCount + 1
      });
      
      toast({
        title: "Connection Lost",
        description: `Reconnecting... (Attempt ${connectionState.retryCount + 1}/${MAX_RETRIES})`,
        variant: "destructive",
      });

      retryTimeoutRef.current = setTimeout(() => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Attempting reconnection', {
          attempt: connectionState.retryCount + 1,
          timestamp: new Date().toISOString()
        });
        updateState({ status: 'connecting' });
      }, delay);
    }
  }, [connectionState.retryCount, toast, updateState]);

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
        }
      },
      onError: handleConnectionError
    });

    chatChannels.current.set(chatId, channel);
  }, [subscribe, handleConnectionError]);

  const unsubscribeFromChat = useCallback((chatId: string) => {
    const channel = chatChannels.current.get(chatId);
    if (channel) {
      supabase.removeChannel(channel);
      chatChannels.current.delete(chatId);
    }
  }, []);

  const subscribeToMessage = useCallback((messageId: string, onUpdate: (content: string) => void) => {
    if (messageChannels.current.has(messageId)) return;

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
        }
      },
      onError: handleConnectionError
    });

    messageChannels.current.set(messageId, channel);
  }, [subscribe, handleConnectionError]);

  const unsubscribeFromMessage = useCallback((messageId: string) => {
    const channel = messageChannels.current.get(messageId);
    if (channel) {
      supabase.removeChannel(channel);
      messageChannels.current.delete(messageId);
      messageCallbacks.current.delete(messageId);
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
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