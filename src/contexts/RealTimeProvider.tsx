import React from 'react';
import { RealTimeContext } from './RealTimeContext';
import type { RealtimeChannel } from '@/types/websocket';

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  const mockChannel: RealtimeChannel = {
    topic: 'mock',
    params: {},
    socket: null,
    bindings: [],
    subscribe: async () => 'ok',
    unsubscribe: () => {}
  };

  return (
    <RealTimeContext.Provider value={{
      connectionState: { 
        status: 'connected', 
        retryCount: 0, 
        lastAttempt: Date.now() 
      },
      lastMessage: undefined,
      subscribeToChat: () => {},
      unsubscribeFromChat: () => {},
      subscribeToMessage: () => {},
      unsubscribeFromMessage: () => {},
      subscribe: () => mockChannel,
      cleanup: () => {}
    }}>
      {children}
    </RealTimeContext.Provider>
  );
};