import React, { useRef, useEffect } from 'react';
import { RealTimeContext } from './RealTimeContext';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';
import { useConnectionState } from './realtime/connectionState';
import { SessionValidator } from '@/utils/realtime/SessionValidator';
import { SubscriptionManager } from './realtime/SubscriptionManager';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types/chat';
import type { RealtimeContextValue } from './realtime/types';

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const [lastMessage, setLastMessage] = React.useState<Message>();
  const { state: connectionState, updateState, resetState } = useConnectionState();
  
  const subscriptionManager = useRef(new SubscriptionManager());
  const channelRef = useRef<any>(null);
  const sessionRef = useRef<string | null>(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error(LogCategory.AUTH, 'RealTimeProvider', 'Failed to get session', {
            error: error.message,
            timestamp: new Date().toISOString()
          });
          return;
        }

        if (!SessionValidator.validateSession(session)) {
          return;
        }

        SessionValidator.logSessionValidation(session, 'RealTimeProvider');
        sessionRef.current = session.user.id;

      } catch (error) {
        logger.error(LogCategory.AUTH, 'RealTimeProvider', 'Session retrieval error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    };
    
    getSession();
  }, []);

  useEffect(() => {
    if (!sessionRef.current) {
      logger.warn(LogCategory.WEBSOCKET, 'RealTimeProvider', 'No session available for channel setup', {
        timestamp: new Date().toISOString()
      });
      return;
    }

    const channel = supabase.channel('chat-updates', {
      config: { broadcast: { self: true } }
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Presence sync', {
          state: channel.presenceState(),
          sessionId: sessionRef.current,
          timestamp: new Date().toISOString()
        });
      })
      .subscribe(async (status) => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Channel status changed', {
          status,
          timestamp: new Date().toISOString()
        });

        if (status === 'SUBSCRIBED') {
          updateState({ status: 'connected', retryCount: 0, error: undefined });
          toast({
            description: "Connection restored",
            className: "bg-green-500 text-white",
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          updateState({
            status: 'disconnected',
            retryCount: connectionState.retryCount + 1,
            error: new Error(`Channel ${status}`)
          });
          toast({
            title: "Connection Lost",
            description: `Reconnecting... (Attempt ${connectionState.retryCount + 1}/5)`,
            variant: "destructive",
          });
        }
      });

    return () => {
      logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Cleaning up channel', {
        timestamp: new Date().toISOString()
      });
      
      if (channelRef.current) {
        subscriptionManager.current.cleanup();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [connectionState.retryCount, toast, updateState]);

  const value: RealtimeContextValue = {
    connectionState,
    lastMessage,
    subscribeToChat: (chatId: string, componentId: string) => {
      const config = {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
        onMessage: (payload: any) => {
          logger.debug(LogCategory.SUBSCRIPTION, 'ChatSubscription', 'Received message', {
            chatId,
            messageId: payload.new?.id,
            type: payload.type,
            timestamp: new Date().toISOString()
          });
          setLastMessage(payload.new as Message);
        },
        onError: (error: Error) => {
          logger.error(LogCategory.SUBSCRIPTION, 'ChatSubscription', 'Subscription error', {
            chatId,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        },
        onSubscriptionStatus: (status: string) => {
          logger.info(LogCategory.SUBSCRIPTION, 'ChatSubscription', 'Chat subscription status changed', {
            chatId,
            status,
            timestamp: new Date().toISOString()
          });
        }
      };

      subscriptionManager.current.subscribe(config);
    },
    unsubscribeFromChat: (chatId: string) => {
      subscriptionManager.current.cleanup(`messages-chat_id=eq.${chatId}`);
    },
    subscribeToMessage: (messageId: string, componentId: string, onUpdate: (content: string) => void) => {
      const config = {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `id=eq.${messageId}`,
        onMessage: (payload: any) => {
          onUpdate(payload.new.content);
          logger.debug(LogCategory.SUBSCRIPTION, 'MessageSubscription', 'Received message update', {
            messageId,
            content: payload.new.content,
            timestamp: new Date().toISOString()
          });
        },
        onError: (error: Error) => {
          logger.error(LogCategory.SUBSCRIPTION, 'MessageSubscription', 'Subscription error', {
            messageId,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        },
        onSubscriptionStatus: (status: string) => {
          logger.info(LogCategory.SUBSCRIPTION, 'MessageSubscription', 'Message subscription status changed', {
            messageId,
            status,
            timestamp: new Date().toISOString()
          });
        }
      };

      subscriptionManager.current.subscribe(config);
    },
    unsubscribeFromMessage: (messageId: string) => {
      subscriptionManager.current.cleanup(`messages-id=eq.${messageId}`);
    },
    subscribe: (config) => {
      return subscriptionManager.current.subscribe(config);
    },
    cleanup: (channelKey?: string) => {
      subscriptionManager.current.cleanup(channelKey);
    }
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};