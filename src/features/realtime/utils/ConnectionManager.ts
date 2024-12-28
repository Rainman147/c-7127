import { logger, LogCategory } from '@/utils/logging';
import { ExponentialBackoff } from '@/utils/backoff';
import { QueueManager } from './QueueManager';
import { ConnectionStateTracker } from './ConnectionStateTracker';
import type { SubscriptionConfig } from '../types';
import type { ConnectionState } from '../types';

export class ConnectionManager {
  private stateTracker: ConnectionStateTracker;
  private queueManager: QueueManager;
  private backoff: ExponentialBackoff;

  constructor() {
    this.stateTracker = new ConnectionStateTracker();
    this.queueManager = new QueueManager();
    this.backoff = new ExponentialBackoff({
      initialDelay: 1000,
      maxDelay: 30000,
      maxAttempts: 5
    });
  }

  public isReady(): boolean {
    return this.stateTracker.isReady();
  }

  public queueSubscription(config: SubscriptionConfig): void {
    this.queueManager.queueSubscription(config);
    
    if (this.isReady()) {
      this.processQueue();
    }
  }

  private async processSubscription(subscription: any): Promise<void> {
    const delay = this.backoff.nextDelay();
    if (delay !== null) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    subscription.config.onSubscriptionStatus?.('SUBSCRIBING');
  }

  public async processQueue(): Promise<void> {
    await this.queueManager.processQueue(
      this.isReady(),
      this.processSubscription.bind(this)
    );
  }

  public updateConnectionState(newState: Partial<ConnectionState>): void {
    this.stateTracker.updateConnectionState(newState);

    if (this.isReady()) {
      this.processQueue();
    }
  }

  public getConnectionState(): ConnectionState {
    return this.stateTracker.getConnectionState();
  }

  public clearQueue(): void {
    this.queueManager.clearQueue();
  }
}
