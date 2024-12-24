import { ConnectionState } from "@/contexts/realtime/config";

interface ConnectionStatusBarProps {
  connectionState: ConnectionState;
}

export const ConnectionStatusBar = ({ connectionState }: ConnectionStatusBarProps) => {
  if (connectionState.status === 'connected') return null;

  return (
    <div className="absolute -top-8 left-0 right-0">
      {connectionState.status === 'disconnected' ? (
        <div className="bg-red-500/10 text-red-500 text-sm py-1 px-3 rounded-md text-center">
          Connection lost. Messages will be sent when reconnected. (Attempt {connectionState.retryCount})
        </div>
      ) : (
        <div className="bg-yellow-500/10 text-yellow-500 text-sm py-1 px-3 rounded-md text-center">
          Reconnecting... (Attempt {connectionState.retryCount})
        </div>
      )}
    </div>
  );
};