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
import { measurePerformance } from '@/utils/logging';

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastMessage, setLastMessage] = useState<Message>();
  const connectionManager = useRef(new ConnectionManager());
  const startTime = useRef(Date.now());
  const channelRef = useRef<any>(null);
  
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

  const { handleChatMessage, handleMessageUpdate } = useMessageHandlers(
    setLastMessage,
    () => Math.min(1000 * Math.pow(2, connectionState.retryCount), 30000)
  );

  // Initialize the channel
  useEffect(() => {
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Setting up realtime channel', {
      timestamp: new Date().toISOString(),
      connectionState: connectionState.status,
      retryCount: connectionState.retryCount
    });
    
    const channel = supabase.channel('chat-updates', {
      config: {
        broadcast: { self: true }
      }
    });

    logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Channel created', {
      channelConfig: channel.subscribe,
      timestamp: new Date().toISOString()
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Presence sync', {
          state: channel.presenceState(),
          timestamp: new Date().toISOString()
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Presence join', {
          key,
          newPresences,
          timestamp: new Date().toISOString()
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Presence leave', {
          key,
          leftPresences,
          timestamp: new Date().toISOString()
        });
      })
      .subscribe(async (status) => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Channel status changed', {
          status,
          previousState: connectionState.status,
          retryCount: connectionState.retryCount,
          timestamp: new Date().toISOString()
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
        timestamp: new Date().toISOString()
      });
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [handleConnectionSuccess, handleConnectionError, connectionState.status, connectionState.retryCount]);

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
