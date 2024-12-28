import React, { useState, useRef } from 'react';
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

  // Create a channel for WebSocket management
  const channel = supabase.channel('connection-monitor');

  const { lastPingTime } = useWebSocketManager(
    channel,
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

  logger.debug(LogCategory.STATE, 'RealTimeProvider', 'Provider state', {
    connectionStatus: connectionState.status,
    activeSubscriptions: getActiveSubscriptions().length,
    lastPingTime,
    timestamp: new Date().toISOString()
  });

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