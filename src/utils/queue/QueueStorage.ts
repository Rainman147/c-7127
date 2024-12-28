import { QueuedMessage } from './QueueTypes';
import { logger, LogCategory } from '../logging/LoggerCore';

export class QueueStorage {
  private readonly storageKey = 'message_queue';

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const queue = localStorage.getItem(this.storageKey);
      if (!queue) {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
      }
    }
  }

  async getQueue(): Promise<QueuedMessage[]> {
    const queueStr = localStorage.getItem(this.storageKey);
    return queueStr ? JSON.parse(queueStr) : [];
  }

  async saveQueue(queue: QueuedMessage[]): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(queue));
    logger.debug(LogCategory.STATE, 'QueueStorage', 'Queue saved', {
      queueSize: queue.length,
      timestamp: new Date().toISOString()
    });
  }
}