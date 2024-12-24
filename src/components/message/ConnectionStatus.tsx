import { useRealTime } from '@/contexts/RealTimeContext';
import { Loader2, WifiOff, Wifi } from 'lucide-react';
import { logger, LogCategory } from '@/utils/logging';
import { Tooltip } from '../ui/tooltip';

export const ConnectionStatus = () => {
  const { connectionState } = useRealTime();
  
  if (connectionState.status === 'connected') {
    return (
      <Tooltip content="Connected to chat service">
        <div className="flex items-center justify-center gap-2 py-2 rounded-md mb-4 text-green-500 bg-green-500/10 opacity-0 animate-fade-out">
          <Wifi className="h-4 w-4" />
          <span>Connected</span>
        </div>
      </Tooltip>
    );
  }

  logger.debug(LogCategory.RENDER, 'ConnectionStatus', 'Rendering connection status:', {
    status: connectionState.status,
    retryCount: connectionState.retryCount
  });

  const statusConfig = {
    connecting: {
      className: 'text-yellow-500 bg-yellow-500/10',
      message: `Reconnecting to chat... (Attempt ${connectionState.retryCount})`,
      icon: Loader2,
      tooltipContent: 'Attempting to reconnect to the chat service'
    },
    disconnected: {
      className: 'text-red-500 bg-red-500/10',
      message: `Connection lost. Retrying... (Attempt ${connectionState.retryCount})`,
      icon: WifiOff,
      tooltipContent: 'Connection to chat service lost'
    }
  };

  const config = statusConfig[connectionState.status];
  const Icon = config.icon;

  return (
    <Tooltip content={config.tooltipContent}>
      <div className={`flex items-center justify-center gap-2 py-2 rounded-md mb-4 ${config.className} cursor-help transition-colors animate-fade-in`}>
        <Icon className={`h-4 w-4 ${connectionState.status === 'connecting' ? 'animate-spin' : ''}`} />
        <span>{config.message}</span>
      </div>
    </Tooltip>
  );
};