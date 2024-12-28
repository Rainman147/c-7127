import { create } from 'zustand';
import { logger, LogCategory } from '@/utils/logging';
import type { ConnectionState, ConnectionStore } from './types';

const INITIAL_STATE: ConnectionState = {
  status: 'connecting',
  retryCount: 0,
  error: undefined,
  lastAttempt: Date.now()
};

export const useConnectionState = create<ConnectionStore>((set) => ({
  state: INITIAL_STATE,
  updateState: (newState) => {
    set((current) => {
      const updatedState = {
        ...current.state,
        ...newState,
        lastAttempt: Date.now()
      };

      logger.info(LogCategory.STATE, 'ConnectionState', 'State transition', {
        from: current.state.status,
        to: updatedState.status,
        retryCount: updatedState.retryCount,
        error: updatedState.error?.message,
        timestamp: new Date().toISOString()
      });

      return { state: updatedState };
    });
  },
  resetState: () => set({ state: INITIAL_STATE })
}));