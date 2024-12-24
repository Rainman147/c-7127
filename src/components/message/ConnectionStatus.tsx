import { useRealTime } from '@/contexts/RealTimeContext';
import { Loader2 } from 'lucide-react';
import { logger, LogCategory } from '@/utils/logging';

export const ConnectionStatus = () => {
  const { connectionState } = useRealTime();
  
  if (connectionState.status === 'connected') {
    return null;
  }

  logger.debug(LogCategory.RENDER, 'ConnectionStatus', 'Rendering connection status:', {
    status: connectionState.status,
    retryCount: connectionState.retryCount
  });

  const statusConfig = {
    connecting: {
      className: 'text-yellow-500 bg-yellow-500/10',
      message: `Reconnecting to chat... (Attempt ${connectionState.retryCount})`
    },
    disconnected: {
      className: 'text-red-500 bg-red-500/10',
      message: `Connection lost. Retrying... (Attempt ${connectionState.retryCount})`
    }
  };

  const config = statusConfig[connectionState.status];

  return (
    <div className={`flex items-center justify-center gap-2 py-2 rounded-md mb-4 ${config.className}`}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{config.message}</span>
    </div>
  );
};