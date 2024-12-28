import { useRealTime } from "@/contexts/RealTimeContext";

export const useConnectionStatus = () => {
  const { connectionState } = useRealTime();

  const getPlaceholder = () => {
    if (connectionState.status === 'disconnected' && connectionState.retryCount >= 5) {
      return 'Connection lost. Please refresh the page...';
    }
    if (connectionState.status === 'disconnected') {
      return 'Connection lost. Messages will be sent when reconnected...';
    }
    if (connectionState.status === 'connecting') {
      return 'Reconnecting...';
    }
    return 'Message DocTation';
  };

  const getInputTooltip = () => {
    if (connectionState.status === 'disconnected' && connectionState.retryCount >= 5) {
      return 'Please refresh the page to reconnect';
    }
    if (connectionState.status === 'disconnected') {
      return 'Messages will be queued and sent when connection is restored';
    }
    if (connectionState.status === 'connecting') {
      return 'Attempting to reconnect to chat service';
    }
    return '';
  };

  return {
    connectionState,
    getPlaceholder,
    getInputTooltip
  };
};