import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';

interface RealTimeContextValue {
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  subscribeToMessage: (messageId: string, onUpdate: (content: string) => void) => void;
  unsubscribeFromMessage: (messageId: string) => void;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  retryCount: number;
  lastMessage?: Message;
}

const RealTimeContext = createContext<RealTimeContextValue | undefined>(undefined);

const RETRY_DELAY = 1000;
const MAX_RETRIES = 5;

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<Message>();
  
  const chatChannels = useRef(new Map<string, RealtimeChannel>());
  const messageChannels = useRef(new Map<string, RealtimeChannel>());
  const messageCallbacks = useRef(new Map<string, (content: string) => void>());
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const handleConnectionError = useCallback(() => {
    logger.error(LogCategory.WEBSOCKET, 'RealTimeContext', 'Connection error occurred', {
      retryCount,
      timestamp: new Date().toISOString()
    });

    setConnectionStatus('disconnected');
    
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      setRetryCount(prev => prev + 1);
      
      toast({
        title: "Connection Lost",
        description: `Reconnecting... (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
        variant: "destructive",
      });

      retryTimeoutRef.current = setTimeout(() => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Attempting reconnection', {
          attempt: retryCount + 1,
          timestamp: new Date().toISOString()
        });
        setConnectionStatus('connecting');
      }, delay);
    }
  }, [retryCount, toast]);

  const handleConnectionSuccess = useCallback(() => {
    logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Connection established', {
      timestamp: new Date().toISOString()
    });
    
    setConnectionStatus('connected');
    setRetryCount(0);
    
    if (retryCount > 0) {
      toast({
        description: "Connection restored",
        className: "bg-green-500 text-white",
      });
    }
  }, [retryCount, toast]);

  const subscribeToChat = useCallback((chatId: string) => {
    if (chatChannels.current.has(chatId)) {
      logger.debug(LogCategory.WEBSOCKET, 'RealTimeContext', 'Already subscribed to chat', { chatId });
      return;
    }

    logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Subscribing to chat', { chatId });
    
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
          logger.debug(LogCategory.WEBSOCKET, 'RealTimeContext', 'Chat message received', {
            chatId,
            eventType: payload.eventType,
            timestamp: new Date().toISOString()
          });

          if (payload.eventType === 'INSERT') {
            setLastMessage(payload.new as Message);
          }
        }
      )
      .subscribe(status => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Chat subscription status', {
          chatId,
          status,
          timestamp: new Date().toISOString()
        });

        if (status === 'SUBSCRIBED') {
          handleConnectionSuccess();
          chatChannels.current.set(chatId, channel);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          handleConnectionError();
        }
      });
  }, [handleConnectionSuccess, handleConnectionError]);

  const subscribeToMessage = useCallback((messageId: string, onUpdate: (content: string) => void) => {
    if (messageChannels.current.has(messageId)) {
      logger.debug(LogCategory.WEBSOCKET, 'RealTimeContext', 'Already subscribed to message', { messageId });
      return;
    }

    logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Subscribing to message', { messageId });
    
    messageCallbacks.current.set(messageId, onUpdate);
    
    const channel = supabase
      .channel(`message-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `id=eq.${messageId}`
        },
        (payload) => {
          logger.debug(LogCategory.WEBSOCKET, 'RealTimeContext', 'Message update received', {
            messageId,
            eventType: payload.eventType,
            timestamp: new Date().toISOString()
          });

          const callback = messageCallbacks.current.get(messageId);
          if (callback && payload.new) {
            callback(payload.new.content);
          }
        }
      )
      .subscribe(status => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Message subscription status', {
          messageId,
          status,
          timestamp: new Date().toISOString()
        });

        if (status === 'SUBSCRIBED') {
          handleConnectionSuccess();
          messageChannels.current.set(messageId, channel);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          handleConnectionError();
        }
      });
  }, [handleConnectionSuccess, handleConnectionError]);

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
      logger.info(LogCategory.WEBSOCKET, 'RealTimeContext', 'Cleaning up all subscriptions');
      
      chatChannels.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      messageChannels.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      
      chatChannels.current.clear();
      messageChannels.current.clear();
      messageCallbacks.current.clear();
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const value: RealTimeContextValue = {
    subscribeToChat,
    unsubscribeFromChat,
    subscribeToMessage,
    unsubscribeFromMessage,
    connectionStatus,
    retryCount,
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