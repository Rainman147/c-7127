import { ConnectionState } from "@/contexts/realtime/config";
import { Loader2 } from "lucide-react";

interface ConnectionStatusBarProps {
  connectionState: ConnectionState;
}

export const ConnectionStatusBar = ({ connectionState }: ConnectionStatusBarProps) => {
  if (connectionState.status === 'connected') return null;

  return (
    <div className="absolute -top-8 left-0 right-0">
      {connectionState.status === 'disconnected' ? (
        <div className="bg-red-500/10 text-red-500 text-sm py-1 px-3 rounded-md text-center flex items-center justify-center gap-2">
          <span>
            {connectionState.retryCount >= 5 
              ? "Connection lost. Attempting to reconnect in the background..."
              : "Connection lost. Messages will be sent when reconnected."}
          </span>
          <span className="text-xs opacity-75">
            {connectionState.retryCount >= 5 
              ? "(Background retry)"
              : `(Attempt ${connectionState.retryCount}/5)`}
          </span>
        </div>
      ) : (
        <div className="bg-yellow-500/10 text-yellow-500 text-sm py-1 px-3 rounded-md text-center flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Reconnecting...</span>
          <span className="text-xs opacity-75">(Attempt {connectionState.retryCount}/5)</span>
        </div>
      )}
    </div>
  );
};