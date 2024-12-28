import { useEffect, useMemo } from 'react';
import { RealtimeClient } from '@supabase/supabase-js';
import { RealTimeContext } from '../context/RealTimeContext';
import { useConnectionState } from '../hooks/useConnectionState';
import { useSubscriptionManager } from '../hooks/useSubscriptionManager';
import { useMessageHandlers } from '../hooks/useMessageHandlers';
import { logger, LogCategory } from '@/utils/logging';

interface RealTimeProviderProps {
  children: React.ReactNode;
  client: RealtimeClient;
}

export const RealTimeProvider = ({ children, client }: RealTimeProviderProps) => {
  const { connectionState, connect, disconnect } = useConnectionState(client);
  const { handleMessage } = useMessageHandlers();

  const subscriptionConfig = useMemo(() => ({
    event: 'postgres_changes' as const,
    schema: 'public',
    table: 'messages',
    filter: '*'
  }), []);

  const subscription = useSubscriptionManager(
    client.channel('db-changes'),
    subscriptionConfig,
    handleMessage
  );

  useEffect(() => {
    logger.debug(LogCategory.STATE, 'RealTimeProvider', 'Connection state changed:', connectionState);
  }, [connectionState]);

  const contextValue = useMemo(() => ({
    connectionState,
    connect,
    disconnect,
    subscription
  }), [connectionState, connect, disconnect, subscription]);

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
};