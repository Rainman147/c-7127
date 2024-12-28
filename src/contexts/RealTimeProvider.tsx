import React, { useState, useRef, useEffect } from 'react';
import { RealTimeContext } from './RealTimeContext';
import { useWebSocketManager } from './realtime/WebSocketManager';
import { useSubscriptionManager } from './realtime/SubscriptionManager';
import { useMessageHandlers } from '@/hooks/realtime/useMessageHandlers';
import { useConnectionState } from '@/hooks/realtime/useConnectionState';
import { useChatSubscription } from '@/hooks/realtime/useChatSubscription';
import { useMessageSubscription } from '@/hooks/realtime/useMessageSubscription';
import { ConnectionManager } from '@/utils/realtime/ConnectionManager';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import type { RealtimeContextValue } from './realtime/types';
import { supabase } from '@/integrations/supabase/client';

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastMessage, setLastMessage] = useState<Message>();
  const connectionManager = useRef(new ConnectionManager());
  const startTime = useRef(Date.now());
  const channelRef = useRef<any>(null);
  const sessionRef = useRef<string | null>(null);
  
  const {
    connectionState,
    handleConnectionSuccess,
    handleConnectionError
  } = useConnectionState();

  const {
    subscribe: subscriptionManagerSubscribe,
    cleanup: cleanupSubscriptions,
    getActiveSubscriptions
  } = useSubscriptionManager();

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error(LogCategory.STATE, 'RealTimeProvider', 'Failed to get session', {
            error: error.message,
            timestamp: new Date().toISOString()
          });
          return;
        }

        const newSessionId = data?.session?.user?.id || null;
        
        logger.info(LogCategory.STATE, 'RealTimeProvider', 'Session state updated', {
          previousSessionId: sessionRef.current,
          newSessionId,
          hasSession: !!data?.session,
          connectionState: connectionState.status,
          timestamp: new Date().toISOString()
        });
        
        sessionRef.current = newSessionId;
      } catch (error) {
        logger.error(LogCategory.STATE, 'RealTimeProvider', 'Unexpected error getting session', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    };
    
    getSession();
  }, [connectionState.status]);

  const { handleChatMessage, handleMessageUpdate } = useMessageHandlers(
    (message: Message) => {
      logger.debug(LogCategory.STATE, 'RealTimeProvider', 'Handling new message', {
        messageId: message.id,
        type: message.type,
        sessionId: sessionRef.current,
        connectionState: connectionState.status,
        timestamp: new Date().toISOString()
      });
      setLastMessage(message);
    },
    () => Math.min(1000 * Math.pow(2, connectionState.retryCount), 30000)
  );

  const {
    subscribeToChat,
    unsubscribeFromChat
  } = useChatSubscription(
    subscriptionManagerSubscribe, 
    cleanupSubscriptions, 
    handleConnectionError,
    (error) => {
      logger.error(LogCategory.STATE, 'RealTimeProvider', 'Chat subscription error', {
        error: error.message,
        sessionId: sessionRef.current,
        connectionState: connectionState.status,
        retryCount: connectionState.retryCount,
        timestamp: new Date().toISOString()
      });
    }
  );

  const {
    subscribeToMessage,
    unsubscribeFromMessage
  } = useMessageSubscription(
    subscriptionManagerSubscribe, 
    cleanupSubscriptions, 
    handleConnectionError,
    handleMessageUpdate
  );

  useEffect(() => {
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Setting up realtime channel', {
      timestamp: new Date().toISOString(),
      connectionState: connectionState.status,
      retryCount: connectionState.retryCount,
      sessionId: sessionRef.current,
      activeSubscriptions: getActiveSubscriptions()
    });
    
    const channel = supabase.channel('chat-updates', {
      config: {
        broadcast: { self: true }
      }
    });

    logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Channel created', {
      channelConfig: channel.subscribe,
      timestamp: new Date().toISOString(),
      sessionId: sessionRef.current
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
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Presence join', {
          key,
          newPresences,
          sessionId: sessionRef.current,
          timestamp: new Date().toISOString()
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Presence leave', {
          key,
          leftPresences,
          sessionId: sessionRef.current,
          timestamp: new Date().toISOString()
        });
      })
      .subscribe(async (status) => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Channel status changed', {
          status,
          previousState: connectionState.status,
          retryCount: connectionState.retryCount,
          sessionId: sessionRef.current,
          timestamp: new Date().toISOString(),
          connectionDuration: Date.now() - startTime.current
        });

        if (status === 'SUBSCRIBED') {
          handleConnectionSuccess();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          handleConnectionError(new Error(`Channel ${status}`));
        }
      });

    return () => {
      logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Cleaning up channel', {
        channelName: channel.subscribe.name,
        connectionState: connectionState.status,
        sessionId: sessionRef.current,
        timestamp: new Date().toISOString(),
        totalDuration: Date.now() - startTime.current
      });
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [handleConnectionSuccess, handleConnectionError, connectionState.status, connectionState.retryCount, getActiveSubscriptions]);

  const value: RealtimeContextValue = {
    connectionState,
    lastMessage,
    subscribeToChat,
    unsubscribeFromChat,
    subscribeToMessage,
    unsubscribeFromMessage,
    subscribe: subscriptionManagerSubscribe,
    cleanup: cleanupSubscriptions
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};