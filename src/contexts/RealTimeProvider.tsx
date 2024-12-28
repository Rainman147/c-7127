import React, { useState, useRef } from 'react';
import { RealTimeContext } from './RealTimeContext';
import { useWebSocketManager } from '@/features/realtime/hooks/useWebSocketManager';
import { useSubscriptionManager } from '@/features/realtime/hooks/useSubscriptionManager';
import { useMessageHandlers } from '@/features/realtime/hooks/useMessageHandlers';
import { useConnectionState } from '@/features/realtime/hooks/useConnectionState';
import { useChatSubscription } from '@/features/realtime/hooks/useChatSubscription';
import { useMessageSubscription } from '@/features/realtime/hooks/useMessageSubscription';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import type { RealtimeContextValue } from '@/features/realtime/types';
import { supabase } from '@/integrations/supabase/client';

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastMessage, setLastMessage] = useState<Message>();
  
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
    handleConnectionError,
    'RealTimeProvider'
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