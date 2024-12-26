import { create } from 'zustand';
import { logger, LogCategory } from '@/utils/logging';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface ConnectionState {
  status: ConnectionStatus;
  retryCount: number;
  error?: Error;
  lastAttempt: number;
}

interface ConnectionStateStore {
  state: ConnectionState;
  updateState: (newState: Partial<ConnectionState>) => void;
  resetState: () => void;
}

const INITIAL_STATE: ConnectionState = {
  status: 'connecting',
  retryCount: 0,
  error: undefined,
  lastAttempt: Date.now()
};

export const useConnectionState = create<ConnectionStateStore>((set) => ({
  state: INITIAL_STATE,
  updateState: (newState) => {
    set((current) => {
      const updatedState = {
        ...current.state,
        ...newState,
        lastAttempt: Date.now()
      };

      logger.info(LogCategory.STATE, 'ConnectionState', 'State updated:', {
        from: current.state.status,
        to: updatedState.status,
        retryCount: updatedState.retryCount,
        timestamp: new Date().toISOString()
      });

      return { state: updatedState };
    });
  },
  resetState: () => set({ state: INITIAL_STATE })
}));