import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { useToast } from '@/hooks/use-toast';
import type { DatabaseMessage } from '@/types/database/messages';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { ErrorMetadata } from '@/types/errorTracking';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!messageId) {
      logger.debug(LogCategory.COMMUNICATION, 'Message', 'No message ID provided for real-time subscription');
      return;
    }

    const subscribeStartTime = performance.now();
    let retryTimeout: NodeJS.Timeout;
    
    logger.info(LogCategory.COMMUNICATION, 'Message', 'Setting up real-time subscription', { 
      messageId,
      subscribeStartTime,
      connectionStatus,
      retryCount
    });

    const setupSubscription = () => {
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
                  retryCount,
                  error: error instanceof Error ? error.message : String(error)
                }
              };
              
              ErrorTracker.trackError(error as Error, metadata);
              
              toast({
                title: "Update Error",
                description: "Failed to process message update. Retrying...",
                variant: "destructive"
              });
            }
          }
        )
        .subscribe(status => {
          setConnectionStatus(status);
          logger.info(LogCategory.COMMUNICATION, 'Message', 'Subscription status changed', { 
            status,
            messageId,
            setupDuration: performance.now() - subscribeStartTime,
            retryCount
          });

          if (status === 'SUBSCRIBED') {
            setRetryCount(0);
            toast({
              description: "Connected to chat service",
              className: "bg-green-500 text-white",
            });
          } else if (status === 'CHANNEL_ERROR') {
            const error = new Error(`Channel error for message ${messageId}`);
            const metadata: ErrorMetadata = {
              component: 'useMessageRealtime',
              severity: 'high',
              errorType: 'connection',
              operation: 'subscribe',
              timestamp: new Date().toISOString(),
              additionalInfo: {
                messageId,
                status,
                retryCount,
                setupDuration: performance.now() - subscribeStartTime
              }
            };
            
            ErrorTracker.trackError(error, metadata);
            
            if (retryCount < MAX_RETRIES) {
              const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
              logger.info(LogCategory.COMMUNICATION, 'Message', 'Scheduling retry', {
                retryCount,
                delay,
                messageId
              });
              
              setRetryCount(prev => prev + 1);
              retryTimeout = setTimeout(setupSubscription, delay);
              
              toast({
                title: "Connection Error",
                description: `Reconnecting... (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
                variant: "destructive"
              });
            } else {
              toast({
                title: "Connection Failed",
                description: "Unable to establish connection after multiple attempts. Please refresh the page.",
                variant: "destructive"
              });
            }
          }
        });

      return channel;
    };

    const channel = setupSubscription();

    return () => {
      logger.info(LogCategory.COMMUNICATION, 'Message', 'Cleaning up real-time subscription', {
        messageId,
        finalConnectionStatus: connectionStatus,
        totalDuration: performance.now() - subscribeStartTime
      });
      
      clearTimeout(retryTimeout);
      supabase.removeChannel(channel);
    };
  }, [messageId, editedContent, setEditedContent, connectionStatus, lastUpdateTime, retryCount, toast]);

  return {
    connectionStatus,
    lastUpdateTime,
    retryCount
  };
};