import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { useToast } from '@/hooks/use-toast';
import type { DatabaseMessage } from '@/types/database/messages';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { ErrorMetadata } from '@/types/errorTracking';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!messageId) {
      logger.debug(LogCategory.COMMUNICATION, 'Message', 'No message ID provided for real-time subscription');
      return;
    }

    const subscribeStartTime = performance.now();
    
    logger.debug(LogCategory.COMMUNICATION, 'Message', 'Setting up real-time subscription', { 
      messageId,
      subscribeStartTime,
      connectionStatus
    });
    
    const channel = supabase
      .channel(`message-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `id=eq.${messageId}`
        },
        (payload: RealtimePostgresChangesPayload<DatabaseMessage>) => {
          try {
            const updateReceiveTime = performance.now();
            const latency = lastUpdateTime ? updateReceiveTime - lastUpdateTime : null;
            
            logger.debug(LogCategory.COMMUNICATION, 'Message', 'Received real-time update', {
              messageId,
              payload,
              updateReceiveTime,
              latency,
              connectionStatus
            });
            
            const newData = payload.new as DatabaseMessage;
            if (newData && newData.content !== editedContent) {
              setEditedContent(newData.content);
              setLastUpdateTime(updateReceiveTime);
              
              logger.info(LogCategory.STATE, 'Message', 'Updated message content', {
                messageId,
                contentLength: newData.content.length,
                updateTime: updateReceiveTime
              });
            }
          } catch (error) {
            const metadata: ErrorMetadata = {
              component: 'useMessageRealtime',
              severity: 'medium',
              errorType: 'realtime',
              operation: 'process-update',
              timestamp: new Date().toISOString(),
              additionalInfo: {
                messageId,
                connectionStatus,
                error: error instanceof Error ? error.message : String(error)
              }
            };
            
            ErrorTracker.trackError(error as Error, metadata);
            
            toast({
              title: "Real-time Update Error",
              description: "Failed to process message update. Please refresh the page.",
              variant: "destructive"
            });
          }
        }
      )
      .subscribe(status => {
        setConnectionStatus(status);
        logger.debug(LogCategory.COMMUNICATION, 'Message', 'Subscription status changed', { 
          status,
          messageId,
          setupDuration: performance.now() - subscribeStartTime
        });

        if (status === 'SUBSCRIBED') {
          toast({
            description: "Real-time connection established",
            className: "bg-green-500 text-white",
          });
        } else if (status === 'CHANNEL_ERROR') {
          const metadata: ErrorMetadata = {
            component: 'useMessageRealtime',
            severity: 'high',
            errorType: 'connection',
            operation: 'subscribe',
            timestamp: new Date().toISOString(),
            additionalInfo: {
              messageId,
              status,
              setupDuration: performance.now() - subscribeStartTime
            }
          };
          
          ErrorTracker.trackError(new Error(`Channel error for message ${messageId}`), metadata);
          
          toast({
            title: "Connection Error",
            description: "Failed to establish real-time connection. Messages may be delayed.",
            variant: "destructive"
          });
        }
      });

    return () => {
      logger.debug(LogCategory.COMMUNICATION, 'Message', 'Cleaning up real-time subscription', {
        messageId,
        finalConnectionStatus: connectionStatus,
        totalDuration: performance.now() - subscribeStartTime
      });
      supabase.removeChannel(channel);
    };
  }, [messageId, editedContent, setEditedContent, connectionStatus, lastUpdateTime, toast]);

  return {
    connectionStatus,
    lastUpdateTime
  };
};