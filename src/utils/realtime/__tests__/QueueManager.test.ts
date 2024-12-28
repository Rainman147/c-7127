import { QueueManager } from '../QueueManager';
import { logger } from '@/utils/logging';
import type { SubscriptionConfig } from '@/contexts/realtime/types';

jest.mock('@/utils/logging');

describe('QueueManager', () => {
  let queueManager: QueueManager;

  beforeEach(() => {
    jest.clearAllMocks();
    queueManager = new QueueManager();
  });

  describe('queueSubscription', () => {
    it('should add subscription to queue', () => {
      const config: SubscriptionConfig = {
        event: 'INSERT',
        schema: 'public',
        table: 'test',
        filter: 'test',
        onMessage: () => {}
      };
      queueManager.queueSubscription(config);
      expect(queueManager.getQueueSize()).toBe(1);
    });
  });

  describe('processQueue', () => {
    it('should process all queued subscriptions when ready', async () => {
      const processSubscription = jest.fn();
      const config: SubscriptionConfig = {
        event: 'INSERT',
        schema: 'public',
        table: 'test',
        filter: 'test',
        onMessage: () => {}
      };
      
      queueManager.queueSubscription(config);
      await queueManager.processQueue(true, processSubscription);
      
      expect(processSubscription).toHaveBeenCalledWith(expect.objectContaining({
        config,
        retryCount: 0
      }));
    });

    it('should not process queue when not ready', async () => {
      const processSubscription = jest.fn();
      const config: SubscriptionConfig = {
        event: 'INSERT',
        schema: 'public',
        table: 'test',
        filter: 'test',
        onMessage: () => {}
      };
      
      queueManager.queueSubscription(config);
      await queueManager.processQueue(false, processSubscription);
      
      expect(processSubscription).not.toHaveBeenCalled();
    });
  });
});