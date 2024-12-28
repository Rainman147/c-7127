import { create } from 'zustand';
import { logger, LogCategory } from '@/utils/logging';
import type { ConnectionState, ConnectionStore } from './types';

const INITIAL_STATE: ConnectionState = {
  status: 'connecting',
  retryCount: 0,
  lastAttempt: Date.now(),
  error: undefined
};

export const useConnectionState = create<ConnectionStore>((set) => ({
  connectionState: INITIAL_STATE,
  setConnectionState: (newState) => 
    set((current) => {
      const updatedState = {
        ...current.connectionState,
        ...newState,
        lastAttempt: Date.now()
      };

      logger.info(LogCategory.STATE, 'ConnectionState', 'State transition', {
        from: current.connectionState.status,
        to: updatedState.status,
        retryCount: updatedState.retryCount,
        error: updatedState.error?.message,
        timestamp: new Date().toISOString()
      });

      return { connectionState: updatedState };
    }),
  resetState: () => set({ connectionState: INITIAL_STATE })
}));