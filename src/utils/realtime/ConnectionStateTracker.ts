import { logger, LogCategory } from '@/utils/logging';
import type { ConnectionState } from '@/features/realtime/types';

export class ConnectionStateTracker {
  private state: ConnectionState = {
    status: 'connecting',
    retryCount: 0,
    lastAttempt: Date.now()
  };

  public isReady(): boolean {
    return this.state.status === 'connected';
  }

  public updateConnectionState(newState: Partial<ConnectionState>): void {
    this.state = {
      ...this.state,
      ...newState,
      lastAttempt: Date.now()
    };

    logger.debug(LogCategory.STATE, 'ConnectionStateTracker', 'State updated', {
      newState: this.state,
      timestamp: new Date().toISOString()
    });
  }

  public getConnectionState(): ConnectionState {
    return { ...this.state };
  }
}