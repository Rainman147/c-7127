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
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Setting up realtime channel');
    
    const channel = supabase.channel('chat-updates', {
      config: {
        broadcast: { self: true }
      }
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Presence sync', {
          state: channel.presenceState()
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Presence join', {
          key,
          newPresences
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        logger.debug(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Presence leave', {
          key,
          leftPresences
        });
      })
      .subscribe(async (status) => {
        logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Channel status changed', {
          status,
          timestamp: new Date().toISOString()
        });

        if (status === 'SUBSCRIBED') {
          handleConnectionSuccess();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          handleConnectionError(new Error(`Channel ${status}`));
        }
      });

    return () => {
      logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Cleaning up channel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [handleConnectionSuccess, handleConnectionError]);

  // Create a channel for WebSocket management
  const { lastPingTime } = useWebSocketManager(
    channelRef.current,
    handleConnectionError
  );

  const { subscribeToChat, unsubscribeFromChat } = useChatSubscription(
    subscriptionManagerSubscribe,
    cleanupSubscriptions,
    handleConnectionError
  );

  const { subscribeToMessage, unsubscribeFromMessage } = useMessageSubscription(
    subscriptionManagerSubscribe,
    cleanupSubscriptions,
    handleConnectionError,
    handleMessageUpdate
  );

  // Enhanced logging for state changes
  useEffect(() => {
    logger.info(LogCategory.STATE, 'RealTimeProvider', 'Connection state changed', {
      status: connectionState.status,
      retryCount: connectionState.retryCount,
      lastAttempt: new Date(connectionState.lastAttempt).toISOString(),
      error: connectionState.error?.message,
      activeSubscriptions: getActiveSubscriptions().length,
      lastPingTime: lastPingTime ? new Date(lastPingTime).toISOString() : undefined,
      uptime: Date.now() - startTime.current,
      timestamp: new Date().toISOString()
    });
  }, [connectionState, lastPingTime, getActiveSubscriptions]);

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