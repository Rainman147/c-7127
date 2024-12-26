import { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { useConnectionState, type ConnectionState } from './realtime/connectionState';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '@/types/chat';

interface RealTimeContextValue {
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  subscribeToMessage: (messageId: string, onUpdate: (content: string) => void) => void;
  unsubscribeFromMessage: (messageId: string) => void;
  connectionState: ConnectionState;
  lastMessage?: Message;
}

const RealTimeContext = createContext<RealTimeContextValue | undefined>(undefined);

const RETRY_DELAY = 1000;
const MAX_RETRIES = 5;

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const { state: connectionState, updateState, resetState } = useConnectionState();
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
          updateState({ status: 'connected', retryCount: 0 });
          chatChannels.current.set(chatId, channel);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          handleConnectionError();
        }
      });
  }, [handleConnectionError, updateState]);

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
          updateState({ status: 'connected', retryCount: 0 });
          messageChannels.current.set(messageId, channel);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          handleConnectionError();
        }
      });
  }, [handleConnectionError, updateState]);

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

  useEffect(() => {
    return () => {
      resetState();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      chatChannels.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      messageChannels.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      chatChannels.current.clear();
      messageChannels.current.clear();
      messageCallbacks.current.clear();
    };
  }, [resetState]);

  const value: RealTimeContextValue = {
    subscribeToChat,
    unsubscribeFromChat,
    subscribeToMessage,
    unsubscribeFromMessage,
    connectionState: connectionState,
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
