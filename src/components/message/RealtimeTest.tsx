import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMessageRealtime } from '@/hooks/realtime/useMessageRealtime';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { useId } from 'react';

const TEST_MESSAGE_ID = '12345-test-id';

export const RealtimeTest = () => {
  const [content, setContent] = useState('Initial content');
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const componentId = useId();

  const { connectionState, retryCount } = useMessageRealtime(
    TEST_MESSAGE_ID,
    content,
    setContent,
    componentId
  );

  // Log state changes
  useEffect(() => {
    logger.debug(LogCategory.STATE, 'RealtimeTest', 'Connection state changed:', {
      status: connectionState.status,
      retryCount,
      componentId,
      timestamp: new Date().toISOString()
    });
  }, [connectionState, retryCount, componentId]);

  const handleSimulateError = () => {
    // Force a connection error by attempting to connect to an invalid channel
    const invalidMessageId = undefined;
    useMessageRealtime(invalidMessageId, content, setContent, componentId);
    
    toast({
      title: "Error Simulated",
      description: "Attempted to connect with invalid message ID",
      variant: "destructive",
    });
  };

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
    
    toast({
      title: isVisible ? "Component Hidden" : "Component Visible",
      description: "Testing cleanup on unmount",
    });
  };

  if (!isVisible) {
    return (
      <Button onClick={handleToggleVisibility}>
        Show Test Component
      </Button>
    );
  }

  return (
    <div className="p-4 space-y-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Realtime Test Component</h2>
      
      <div className="space-y-2">
        <p>Connection Status: <span className={`font-bold ${connectionState.status === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
          {connectionState.status}
        </span></p>
        <p>Retry Count: {retryCount}</p>
        <p>Current Content: {content}</p>
      </div>

      <div className="space-x-2">
        <Button onClick={handleSimulateError} variant="destructive">
          Simulate Error
        </Button>
        <Button onClick={handleToggleVisibility} variant="outline">
          Hide Component
        </Button>
      </div>
    </div>
  );
};