import { ConnectionManager } from '../ConnectionManager';
import { QueueManager } from '../QueueManager';
import { ConnectionStateTracker } from '../ConnectionStateTracker';
import { logger } from '@/utils/logging';

// Mock dependencies
jest.mock('@/utils/logging');
jest.mock('../QueueManager');
jest.mock('../ConnectionStateTracker');

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    connectionManager = new ConnectionManager();
  });

  describe('isReady', () => {
    it('should return true when connection state is ready', () => {
      const result = connectionManager.isReady();
      expect(result).toBe(true);
    });
  });

  describe('queueSubscription', () => {
    it('should process subscription immediately if ready', () => {
      const config = { table: 'test', filter: 'test' };
      connectionManager.queueSubscription(config);
      expect(connectionManager['queueManager'].queueSubscription).toHaveBeenCalledWith(config);
    });

    it('should queue subscription if not ready', () => {
      jest.spyOn(connectionManager, 'isReady').mockReturnValue(false);
      const config = { table: 'test', filter: 'test' };
      connectionManager.queueSubscription(config);
      expect(connectionManager['queueManager'].queueSubscription).toHaveBeenCalledWith(config);
    });
  });

  describe('updateConnectionState', () => {
    it('should update state and process queue if becoming ready', () => {
      const newState = { status: 'connected', retryCount: 0 };
      connectionManager.updateConnectionState(newState);
      expect(connectionManager['stateTracker'].updateConnectionState).toHaveBeenCalledWith(newState);
    });
  });
});