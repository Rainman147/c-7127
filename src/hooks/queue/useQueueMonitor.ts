import { useState, useEffect } from 'react';
import { queueManager } from '@/utils/queue/QueueManager';
import { logger, LogCategory } from '@/utils/logging';

export const useQueueMonitor = () => {
  const [queueStatus, setQueueStatus] = useState({
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0
  });

  useEffect(() => {
    const updateStatus = async () => {
      const status = await queueManager.getQueueStatus();
      setQueueStatus(status);
      
      logger.debug(LogCategory.STATE, 'QueueMonitor', 'Queue status updated', {
        status,
        timestamp: new Date().toISOString()
      });
    };

    const interval = setInterval(updateStatus, 5000);
    updateStatus();

    return () => clearInterval(interval);
  }, []);

  return queueStatus;
};