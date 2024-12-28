import { logger, LogCategory } from '@/utils/logging';
import type { ConnectionState } from '@/contexts/realtime/types';

export class ConnectionStateTracker {
  private connectionState: ConnectionState = {
    status: 'connecting',
    retryCount: 0,
    lastAttempt: Date.now(),
    error: undefined
  };

  public isReady(): boolean {
    return this.connectionState.status === 'connected';
  }

  public updateConnectionState(newState: Partial<ConnectionState>): void {
    const previousStatus = this.connectionState.status;
    
    this.connectionState = {
      ...this.connectionState,
      ...newState,
      lastAttempt: Date.now()
    };

    logger.info(LogCategory.WEBSOCKET, 'ConnectionStateTracker', 'Connection state updated', {
      previousStatus,
      newStatus: newState.status,
      retryCount: this.connectionState.retryCount,
      timestamp: new Date().toISOString()
    });
  }

  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }
}