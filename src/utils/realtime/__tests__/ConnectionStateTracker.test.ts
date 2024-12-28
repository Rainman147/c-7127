import { ConnectionStateTracker } from '../ConnectionStateTracker';
import { logger } from '@/utils/logging';

jest.mock('@/utils/logging');

describe('ConnectionStateTracker', () => {
  let stateTracker: ConnectionStateTracker;

  beforeEach(() => {
    jest.clearAllMocks();
    stateTracker = new ConnectionStateTracker();
  });

  describe('isReady', () => {
    it('should return true when status is connected', () => {
      stateTracker.updateConnectionState({ status: 'connected' });
      expect(stateTracker.isReady()).toBe(true);
    });

    it('should return false when status is not connected', () => {
      stateTracker.updateConnectionState({ status: 'disconnected' });
      expect(stateTracker.isReady()).toBe(false);
    });
  });

  describe('updateConnectionState', () => {
    it('should update state and log changes', () => {
      const newState = { status: 'connected', retryCount: 0 };
      stateTracker.updateConnectionState(newState);
      expect(logger.info).toHaveBeenCalled();
      expect(stateTracker.getConnectionState().status).toBe('connected');
    });
  });
});