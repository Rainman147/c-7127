import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import type { ConnectionState } from '@/contexts/realtime/types';

export class ConnectionManager {
  private subscriptionQueue: Map<string, () => void> = new Map();
  private connectionState: ConnectionState = {
    status: 'connecting',
    retryCount: 0,
    lastAttempt: Date.now(),
    error: undefined
  };

  private isReady(): boolean {
    return this.connectionState.status === 'connected';
  }

  queueSubscription(key: string, subscribeFunc: () => void): void {
    logger.info(LogCategory.WEBSOCKET, 'ConnectionManager', 'Queueing subscription', {
      key,
      connectionStatus: this.connectionState.status,
      timestamp: new Date().toISOString()
    });
    
    this.subscriptionQueue.set(key, subscribeFunc);
    
    if (this.isReady()) {
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (!this.isReady()) {
      logger.warn(LogCategory.WEBSOCKET, 'ConnectionManager', 'Cannot process queue - connection not ready', {
        status: this.connectionState.status,
        queueSize: this.subscriptionQueue.size,
        timestamp: new Date().toISOString()
      });
      return;
    }

    logger.info(LogCategory.WEBSOCKET, 'ConnectionManager', 'Processing subscription queue', {
      queueSize: this.subscriptionQueue.size,
      timestamp: new Date().toISOString()
    });

    this.subscriptionQueue.forEach((subscribeFunc, key) => {
      try {
        subscribeFunc();
        this.subscriptionQueue.delete(key);
      } catch (error) {
        logger.error(LogCategory.WEBSOCKET, 'ConnectionManager', 'Error processing subscription', {
          key,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
        
        ErrorTracker.trackError(
          error instanceof Error ? error : new Error('Subscription processing failed'),
          {
            component: 'ConnectionManager',
            severity: 'high',
            errorType: 'subscription-processing',
            timestamp: new Date().toISOString(),
            additionalInfo: { key, queueSize: this.subscriptionQueue.size }
          }
        );
      }
    });
  }

  updateConnectionState(newState: ConnectionState): void {
    const previousStatus = this.connectionState.status;
    this.connectionState = newState;

    logger.info(LogCategory.WEBSOCKET, 'ConnectionManager', 'Connection state updated', {
      from: previousStatus,
      to: newState.status,
      retryCount: newState.retryCount,
      timestamp: new Date().toISOString()
    });

    if (newState.status === 'connected') {
      this.processQueue();
    }
  }

  clearQueue(): void {
    logger.info(LogCategory.WEBSOCKET, 'ConnectionManager', 'Clearing subscription queue', {
      queueSize: this.subscriptionQueue.size,
      timestamp: new Date().toISOString()
    });
    this.subscriptionQueue.clear();
  }

  getQueueSize(): number {
    return this.subscriptionQueue.size;
  }
}