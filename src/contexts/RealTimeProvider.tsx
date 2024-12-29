import React from 'react';
import { RealTimeContext } from './RealTimeContext';

export const RealTimeProvider = ({ children }: { children: React.ReactNode }) => {
  // Temporarily disabled real-time functionality
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
      subscribe: () => ({ 
        subscribe: () => ({}),
        unsubscribe: () => {}
      }),
      cleanup: () => {}
    }}>
      {children}
    </RealTimeContext.Provider>
  );
};