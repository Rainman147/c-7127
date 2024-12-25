import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import type { DatabaseMessage } from '@/types/database/messages';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { ErrorMetadata } from '@/types/errorTracking';
import { useConnectionState } from '@/hooks/realtime/useConnectionState';
import { useMessageQueue } from '@/hooks/realtime/useMessageQueue';
import { useWebSocketEvents } from '@/hooks/realtime/useWebSocketEvents';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();
  const { connectionState, handleConnectionSuccess, handleConnectionError } = useConnectionState();
  const { addToQueue, processQueue, clearQueue } = useMessageQueue();
  const lastUpdateTimeRef = useRef<number>(Date.now());

  const processMessage = (payload: RealtimePostgresChangesPayload<DatabaseMessage>) => {
    try {
      const newData = payload.new as DatabaseMessage;
      
      addToQueue(newData.id, newData.content);
      processQueue(editedContent, setEditedContent);
      lastUpdateTimeRef.current = Date.now();

      logger.debug(LogCategory.STATE, 'MessageRealtime', 'Processed message update', {
        messageId: newData.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const metadata: ErrorMetadata = {
        component: 'useMessageRealtime',
        severity: 'medium',
        errorType: 'realtime',
        operation: 'process-message',
        timestamp: new Date().toISOString(),
        additionalInfo: {
          messageId,
          connectionState: connectionState.status,
          error: error instanceof Error ? error.message : String(error)
        }
      };
      
      ErrorTracker.trackError(error as Error, metadata);
      handleConnectionError(error as Error);
    }
  };

  useEffect(() => {
    if (!messageId) {
      logger.debug(LogCategory.COMMUNICATION, 'MessageRealtime', 'No message ID provided');
      return;
    }

    const channelName = `message-${messageId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `id=eq.${messageId}`
        },
        processMessage
      )
      .subscribe();

    channelRef.current = channel;
    useWebSocketEvents(channel, handleConnectionSuccess, handleConnectionError);

    return () => {
      logger.info(LogCategory.COMMUNICATION, 'MessageRealtime', 'Cleaning up subscription', {
        messageId,
        timestamp: new Date().toISOString()
      });
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = undefined;
      }
      
      clearQueue();
    };
  }, [messageId, editedContent, setEditedContent, handleConnectionSuccess, handleConnectionError, clearQueue]);

  return {
    connectionState,
    lastUpdateTime: lastUpdateTimeRef.current,
    retryCount: connectionState.retryCount
  };
};