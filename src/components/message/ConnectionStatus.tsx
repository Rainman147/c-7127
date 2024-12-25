import { useRealTime } from '@/contexts/RealTimeContext';
import { Loader2, WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { logger, LogCategory } from '@/utils/logging';
import { Tooltip } from '../ui/tooltip';
import { Alert } from '../ui/alert';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const ConnectionStatus = () => {
  const { connectionState } = useRealTime();
  const { toast } = useToast();
  
  useEffect(() => {
    logger.debug(LogCategory.STATE, 'ConnectionStatus', 'Connection state changed:', {
      status: connectionState.status,
      retryCount: connectionState.retryCount,
      error: connectionState.error?.message
    });

    if (connectionState.status === 'connected') {
      toast({
        description: "Connected to chat service",
        className: "bg-green-500 text-white",
      });
    } else if (connectionState.status === 'disconnected') {
      toast({
        title: "Connection Lost",
        description: `Attempting to reconnect (Attempt ${connectionState.retryCount})`,
        variant: "destructive",
      });
    }
  }, [connectionState.status, connectionState.retryCount, toast]);
  
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
    retryCount: connectionState.retryCount,
    error: connectionState.error?.message
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
    <div className="space-y-4">
      <Tooltip content={config.tooltipContent}>
        <div className={`flex items-center justify-center gap-2 py-2 rounded-md mb-2 ${config.className} cursor-help transition-colors animate-fade-in`}>
          <Icon className={`h-4 w-4 ${connectionState.status === 'connecting' ? 'animate-spin' : ''}`} />
          <span>{config.message}</span>
        </div>
      </Tooltip>
      
      {connectionState.error && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <span className="ml-2">
            Error: {connectionState.error.message}
          </span>
        </Alert>
      )}
    </div>
  );
};