// Temporarily disabled real-time functionality
import React from 'react';
import { RealTimeContext } from './RealTimeContext';

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <RealTimeContext.Provider value={{
      connectionState: { status: 'connected', retryCount: 0, lastAttempt: Date.now() },
      lastMessage: undefined,
      subscribeToChat: () => {},
      unsubscribeFromChat: () => {},
      subscribeToMessage: () => {},
      unsubscribeFromMessage: () => {},
      subscribe: () => ({ subscribe: () => ({}) }),
      cleanup: () => {}
    }}>
      {children}
    </RealTimeContext.Provider>
  );
};