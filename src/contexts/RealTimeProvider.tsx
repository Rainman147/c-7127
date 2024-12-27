import React, { useState, useRef, useEffect } from 'react';
import { RealTimeContext } from './RealTimeContext';
import { useWebSocketManager } from './realtime/WebSocketManager';
import { useSubscriptionManager } from './realtime/SubscriptionManager';
import { useMessageHandlers } from '@/hooks/realtime/useMessageHandlers';
import { useRealtimeConnection } from '@/hooks/realtime/useRealtimeConnection';
import { useChatSubscription } from '@/hooks/realtime/useChatSubscription';
import { useMessageSubscription } from '@/hooks/realtime/useMessageSubscription';
import { ConnectionManager } from './realtime/ConnectionManager';
import type { Message } from '@/types/chat';
import type { RealtimeContextValue } from './realtime/types';

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

  useEffect(() => {
    return () => {
      cleanupSubscriptions();
      retryManager.reset();
      connectionManager.current.clearQueue();
    };
  }, [cleanupSubscriptions, retryManager, getActiveSubscriptions]);

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