import React, { useState, useRef, useEffect } from 'react';
import { RealTimeContext } from './RealTimeContext';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';
import { ConnectionStateManager } from '@/utils/realtime/ConnectionStateManager';
import { SessionValidator } from '@/utils/realtime/SessionValidator';
import { SubscriptionManager } from '@/utils/realtime/SubscriptionManager';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types/chat';
import type { RealtimeContextValue } from './realtime/types';

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const [lastMessage, setLastMessage] = useState<Message>();
  const [connectionState, setConnectionState] = useState({
    status: 'connecting' as const,
    retryCount: 0,
    lastAttempt: Date.now(),
    error: undefined as Error | undefined
  });

  const connectionManager = useRef(new ConnectionStateManager());
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

  const handleConnectionStateChange = (newState: typeof connectionState) => {
    if (!connectionManager.current.shouldUpdateState(newState, connectionState)) {
      return;
    }

    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Connection state changing', {
      from: connectionState.status,
      to: newState.status,
      retryCount: connectionManager.current.getCurrentRetryCount(),
      timestamp: new Date().toISOString()
    });

    setConnectionState(newState);

    if (newState.status === 'disconnected') {
      const activeSubscriptions = subscriptionManager.current.getActiveSubscriptions();
      activeSubscriptions.forEach(key => {
        subscriptionManager.current.scheduleCleanup(key, 5000); // Clean up after 5 seconds of disconnection
      });

      toast({
        title: "Connection Lost",
        description: `Reconnecting... (Attempt ${connectionManager.current.getCurrentRetryCount()}/5)`,
        variant: "destructive",
      });
    } else if (newState.status === 'connected') {
      connectionManager.current.reset();
      subscriptionManager.current.getActiveSubscriptions().forEach(key => {
        subscriptionManager.current.cancelScheduledCleanup(key);
      });

      toast({
        description: "Connection restored",
        className: "bg-green-500 text-white",
      });
    }
  };

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
          handleConnectionStateChange({
            status: 'connected',
            retryCount: 0,
            lastAttempt: Date.now(),
            error: undefined
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          handleConnectionStateChange({
            status: 'disconnected',
            retryCount: connectionState.retryCount + 1,
            lastAttempt: Date.now(),
            error: new Error(`Channel ${status}`)
          });
        }
      });

    return () => {
      logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Cleaning up channel', {
        timestamp: new Date().toISOString()
      });
      
      if (channelRef.current) {
        subscriptionManager.current.cleanupSubscriptions();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [connectionState.retryCount, toast]);

  const value: RealtimeContextValue = {
    connectionState,
    lastMessage,
    subscribeToChat: (chatId: string, componentId: string) => {
      const subscriptionKey = `messages-chat_id=eq.${chatId}`;
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
        },
        onError: (error: any) => {
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

      subscriptionManager.current.addSubscription(subscriptionKey, supabase.channel(subscriptionKey).on(config));
    },
    unsubscribeFromChat: (chatId: string, componentId: string) => {
      const subscriptionKey = `messages-chat_id=eq.${chatId}`;
      subscriptionManager.current.removeSubscription(subscriptionKey);
    },
    subscribeToMessage: (messageId: string, componentId: string, onUpdate: (content: string) => void) => {
      const subscriptionKey = `messages-id=eq.${messageId}`;
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
        onError: (error: any) => {
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

      subscriptionManager.current.addSubscription(subscriptionKey, supabase.channel(subscriptionKey).on(config));
    },
    unsubscribeFromMessage: (messageId: string, componentId: string) => {
      const subscriptionKey = `messages-id=eq.${messageId}`;
      subscriptionManager.current.removeSubscription(subscriptionKey);
    }
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};
