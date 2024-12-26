import { createContext, useContext } from 'react';
import type { RealtimeContextValue } from './realtime/types';
import { RealTimeProvider } from './RealTimeProvider';

export const RealTimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export const useRealTime = () => {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};

export { RealTimeProvider };