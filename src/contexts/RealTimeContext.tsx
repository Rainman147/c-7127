import { createContext, useContext, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';
import { ExponentialBackoff } from '@/utils/backoff';
import { useSubscriptionManager } from './realtime/useSubscriptionManager';
import { useSubscriptionHandlers } from './realtime/useSubscriptionHandlers';
import type { Message } from '@/types/chat';
import type { RealtimeContextValue, ConnectionState } from './realtime/types';

const RealTimeContext = createContext<RealtimeContextValue | undefined>(undefined);

const backoffConfig = {
  initialDelay: 1000,
  maxDelay: 30000,
  maxAttempts: 5,
  jitter: true
};

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const [lastMessage, setLastMessage] = useState<Message>();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'connecting',
    retryCount: 0,
    error: undefined,
    lastAttempt: Date.now()
  });
  
  const backoff = useRef(new ExponentialBackoff(backoffConfig));
  const { subscribe, cleanup, activeSubscriptions } = useSubscriptionManager();
  const { handleChatMessage, handleMessageUpdate } = useSubscriptionHandlers(setLastMessage, backoff);

  const handleConnectionError = (error: Error) => {
    logger.error(LogCategory.WEBSOCKET, 'RealTimeContext', 'Connection error occurred', {
      error: error.message,
      retryCount: backoff.current.attemptCount,
      timestamp: new Date().toISOString()
    });

    const delay = backoff.current.nextDelay();
    if (delay !== null) {
      setConnectionState({
        status: 'disconnected',
        retryCount: backoff.current.attemptCount,
        error,
        lastAttempt: Date.now()
      });

      toast({
        title: "Connection Lost",
        description: `Reconnecting... (Attempt ${backoff.current.attemptCount}/${backoffConfig.maxAttempts})`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Connection Failed",
        description: "Maximum retry attempts reached. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const subscribeToChat = (chatId: string) => {
    subscribe({
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`,
      onMessage: handleChatMessage,
      onError: handleConnectionError
    });
    
    logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Subscribed to chat', {
      chatId,
      timestamp: new Date().toISOString()
    });
  };

  const unsubscribeFromChat = (chatId: string) => {
    cleanup(`messages-chat_id=eq.${chatId}`);
  };

  const subscribeToMessage = (messageId: string, onUpdate: (content: string) => void) => {
    subscribe({
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `id=eq.${messageId}`,
      onMessage: handleMessageUpdate(messageId, onUpdate),
      onError: handleConnectionError
    });
    
    logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Subscribed to message', {
      messageId,
      timestamp: new Date().toISOString()
    });
  };

  const unsubscribeFromMessage = (messageId: string) => {
    cleanup(`messages-id=eq.${messageId}`);
  };

  const value: RealtimeContextValue = {
    connectionState,
    lastMessage,
    subscribeToChat,
    unsubscribeFromChat,
    subscribeToMessage,
    unsubscribeFromMessage
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