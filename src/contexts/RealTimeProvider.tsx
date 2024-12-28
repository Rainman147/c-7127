import React, { useState, useRef, useEffect } from 'react';
import { RealTimeContext } from './RealTimeContext';
import { useWebSocketManager } from './realtime/WebSocketManager';
import { useSubscriptionManager } from './realtime/SubscriptionManager';
import { useMessageHandlers } from '@/hooks/realtime/useMessageHandlers';
import { useRealtimeConnection } from '@/hooks/realtime/useRealtimeConnection';
import { useChatSubscription } from '@/hooks/realtime/useChatSubscription';
import { useMessageSubscription } from '@/hooks/realtime/useMessageSubscription';
import { ConnectionManager } from '@/utils/realtime/ConnectionManager';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import type { RealtimeContextValue, SubscriptionConfig } from './realtime/types';

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastMessage, setLastMessage] = useState<Message>();
  const connectionManager = useRef(new ConnectionManager());
  
  const {
    connectionState,
    handleConnectionError,
    retryManager
  } = useRealtimeConnection();

  const {
    subscribe: subscriptionManagerSubscribe,
    cleanup: cleanupSubscriptions,
    getActiveSubscriptions
  } = useSubscriptionManager();

  const { handleChatMessage, handleMessageUpdate } = useMessageHandlers(
    setLastMessage,
    retryManager.getNextDelay
  );

  const { lastPingTime } = useWebSocketManager(
    undefined,
    handleConnectionError
  );

  useEffect(() => {
    logger.info(LogCategory.WEBSOCKET, 'RealTimeProvider', 'Updating connection manager state', {
      status: connectionState.status,
      retryCount: connectionState.retryCount,
      timestamp: new Date().toISOString()
    });
    
    connectionManager.current.updateConnectionState(connectionState);
  }, [connectionState]);

  const { subscribeToChat, unsubscribeFromChat } = useChatSubscription(
    (config: SubscriptionConfig) => {
      const subscribeFunc = () => subscriptionManagerSubscribe(config);
      connectionManager.current.queueSubscription(config);
    },
    cleanupSubscriptions,
    handleConnectionError
  );

  const { subscribeToMessage, unsubscribeFromMessage } = useMessageSubscription(
    subscriptionManagerSubscribe,
    cleanupSubscriptions,
    handleConnectionError,
    handleMessageUpdate
  );

  useEffect(() => {
    return () => {
      cleanupSubscriptions();
      retryManager.reset();
      connectionManager.current.clearQueue();
    };
  }, [cleanupSubscriptions, retryManager]);

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