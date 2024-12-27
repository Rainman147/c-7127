import { ConnectionState } from "@/contexts/realtime/config";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { logger, LogCategory } from "@/utils/logging";

interface ConnectionStatusBarProps {
  connectionState: ConnectionState;
}

export const ConnectionStatusBar = ({ connectionState }: ConnectionStatusBarProps) => {
  const { toast } = useToast();

  useEffect(() => {
    logger.info(LogCategory.STATE, 'ConnectionStatusBar', 'Connection state changed:', {
      status: connectionState.status,
      retryCount: connectionState.retryCount,
      timestamp: new Date().toISOString()
    });

    if (connectionState.status === 'connected') {
      toast({
        description: "Connected to chat service",
        className: "bg-green-500 text-white",
      });
    } else if (connectionState.status === 'disconnected') {
      toast({
        title: "Connection Lost",
        description: connectionState.retryCount >= 5 
          ? "Please refresh the page to reconnect"
          : `Reconnecting... (Attempt ${connectionState.retryCount}/5)`,
        variant: "destructive",
      });
    } else if (connectionState.status === 'connecting') {
      toast({
        description: "Attempting to reconnect...",
        className: "bg-yellow-500 text-white",
      });
    }
  }, [connectionState.status, connectionState.retryCount, toast]);

  if (connectionState.status === 'connected') return null;

  return (
    <div 
      className="absolute -top-8 left-0 right-0"
      role="alert"
      aria-live="polite"
    >
      {connectionState.status === 'disconnected' ? (
        <div className="bg-red-500/10 text-red-500 text-sm py-1 px-3 rounded-md text-center flex items-center justify-center gap-2 animate-fade-in">
          <span>
            {connectionState.retryCount >= 5 
              ? "Connection lost. Please refresh the page..."
              : "Connection lost. Messages will be sent when reconnected."}
          </span>
          <span className="text-xs opacity-75">
            {connectionState.retryCount >= 5 
              ? "(Please refresh)"
              : `(Attempt ${connectionState.retryCount}/5)`}
          </span>
        </div>
      ) : (
        <div className="bg-yellow-500/10 text-yellow-500 text-sm py-1 px-3 rounded-md text-center flex items-center justify-center gap-2 animate-fade-in">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Reconnecting...</span>
          <span className="text-xs opacity-75">(Attempt {connectionState.retryCount}/5)</span>
        </div>
      )}
    </div>
  );
};