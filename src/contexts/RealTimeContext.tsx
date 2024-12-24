import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ConnectionState = {
  status: 'connected' | 'connecting' | 'disconnected';
  lastAttempt: number;
  retryCount: number;
  error?: Error;
};

type RealTimeContextValue = {
  connectionState: ConnectionState;
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  activeSubscriptions: Set<string>;
  lastMessage?: Message;
};

const RealTimeContext = createContext<RealTimeContextValue | undefined>(undefined);

export const retryConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxAttempts: 5,
  backoffFactor: 1.5,
};

export const getNextRetryDelay = (attempt: number): number => {
  const delay = retryConfig.initialDelay * Math.pow(retryConfig.backoffFactor, attempt);
  return Math.min(delay, retryConfig.maxDelay);
};

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastAttempt: 0,
    retryCount: 0,
  });
  const [lastMessage, setLastMessage] = useState<Message>();
  const activeSubscriptions = useRef(new Set<string>());
  const channels = useRef(new Map<string, RealtimeChannel>());
  const retryTimeouts = useRef(new Map<string, NodeJS.Timeout>());

  const handleConnectionError = (chatId: string, error: Error) => {
    logger.error(LogCategory.COMMUNICATION, 'RealTimeContext', 'Connection error:', {
      chatId,
      error,
      retryCount: connectionState.retryCount,
    });

    if (connectionState.retryCount < retryConfig.maxAttempts) {
      const nextRetryDelay = getNextRetryDelay(connectionState.retryCount);
      
      setConnectionState(prev => ({
        status: 'connecting',
        lastAttempt: Date.now(),
        retryCount: prev.retryCount + 1,
        error,
      }));

      // Clear any existing retry timeout for this chat
      if (retryTimeouts.current.has(chatId)) {
        clearTimeout(retryTimeouts.current.get(chatId));
      }

      // Set new retry timeout
      const timeout = setTimeout(() => {
        subscribeToChat(chatId);
      }, nextRetryDelay);

      retryTimeouts.current.set(chatId, timeout);
    } else {
      setConnectionState(prev => ({
        ...prev,
        status: 'disconnected',
        error,
      }));
    }
  };

  const subscribeToChat = (chatId: string) => {
    logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Subscribing to chat:', { chatId });

    if (channels.current.has(chatId)) {
      logger.debug(LogCategory.COMMUNICATION, 'RealTimeContext', 'Already subscribed to chat:', { chatId });
      return;
    }

    setConnectionState(prev => ({
      ...prev,
      status: 'connecting',
      lastAttempt: Date.now(),
    }));

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          logger.debug(LogCategory.COMMUNICATION, 'RealTimeContext', 'Received message:', { 
            payload,
            chatId 
          });
          
          // Update last message if it's a new message
          if (payload.eventType === 'INSERT') {
            setLastMessage(payload.new as Message);
          }
        }
      )
      .subscribe(status => {
        logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Subscription status changed:', {
          chatId,
          status,
        });

        if (status === 'SUBSCRIBED') {
          activeSubscriptions.current.add(chatId);
          channels.current.set(chatId, channel);
          setConnectionState({
            status: 'connected',
            lastAttempt: Date.now(),
            retryCount: 0,
          });
        } else if (status === 'CHANNEL_ERROR') {
          handleConnectionError(chatId, new Error(`Failed to subscribe to chat ${chatId}`));
        }
      });
  };

  const unsubscribeFromChat = (chatId: string) => {
    logger.info(LogCategory.COMMUNICATION, 'RealTimeContext', 'Unsubscribing from chat:', { chatId });

    const channel = channels.current.get(chatId);
    if (channel) {
      supabase.removeChannel(channel);
      channels.current.delete(chatId);
      activeSubscriptions.current.delete(chatId);

      // Clear any pending retry timeouts
      if (retryTimeouts.current.has(chatId)) {
        clearTimeout(retryTimeouts.current.get(chatId));
        retryTimeouts.current.delete(chatId);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all subscriptions and timeouts
      channels.current.forEach((channel, chatId) => {
        supabase.removeChannel(channel);
        if (retryTimeouts.current.has(chatId)) {
          clearTimeout(retryTimeouts.current.get(chatId));
        }
      });
      channels.current.clear();
      retryTimeouts.current.clear();
      activeSubscriptions.current.clear();
    };
  }, []);

  const value: RealTimeContextValue = {
    connectionState,
    subscribeToChat,
    unsubscribeFromChat,
    activeSubscriptions: activeSubscriptions.current,
    lastMessage,
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