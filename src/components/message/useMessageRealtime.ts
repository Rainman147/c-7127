import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { useToast } from '@/hooks/use-toast';
import type { DatabaseMessage } from '@/types/database/messages';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { ErrorMetadata } from '@/types/errorTracking';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000; // Cap at 30 seconds
const FALLBACK_RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface MessageQueue {
  [key: string]: {
    content: string;
    timestamp: number;
  };
}

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const messageQueueRef = useRef<MessageQueue>({});
  const fallbackRetryRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();
  const { toast } = useToast();

  const calculateBackoffDelay = (attempt: number): number => {
    const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
    return Math.min(delay, MAX_RETRY_DELAY);
  };

  const handleConnectionStateChange = (newStatus: string) => {
    logger.info(LogCategory.COMMUNICATION, 'MessageRealtime', 'Connection state changed', {
      previousStatus: connectionStatus,
      newStatus,
      messageId,
      retryCount
    });

    setConnectionStatus(newStatus);

    if (newStatus === 'SUBSCRIBED') {
      if (retryCount > 0) {
        toast({
          description: "Connection restored",
          className: "bg-green-500 text-white",
        });
      }
      setRetryCount(0);
    }
  };

  const processMessage = (payload: RealtimePostgresChangesPayload<DatabaseMessage>) => {
    try {
      const updateReceiveTime = performance.now();
      const newData = payload.new as DatabaseMessage;
      
      // Handle out-of-order messages using timestamp-based queue
      messageQueueRef.current[newData.id] = {
        content: newData.content,
        timestamp: updateReceiveTime
      };

      // Process queue in order
      const messages = Object.entries(messageQueueRef.current)
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      for (const [msgId, msg] of messages) {
        if (msg.content !== editedContent) {
          setEditedContent(msg.content);
          setLastUpdateTime(msg.timestamp);
          
          logger.debug(LogCategory.STATE, 'MessageRealtime', 'Updated message content', {
            messageId: msgId,
            contentLength: msg.content.length,
            timestamp: msg.timestamp
          });
        }
        delete messageQueueRef.current[msgId];
      }
    } catch (error) {
      const metadata: ErrorMetadata = {
        component: 'useMessageRealtime',
        severity: 'medium',
        errorType: 'realtime',
        operation: 'process-message',
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
        title: "Message Processing Error",
        description: "Failed to process message update. Retrying...",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!messageId) {
      logger.debug(LogCategory.COMMUNICATION, 'MessageRealtime', 'No message ID provided');
      return;
    }

    const setupSubscription = () => {
      const channelName = `message-${messageId}`;
      logger.info(LogCategory.COMMUNICATION, 'MessageRealtime', 'Setting up subscription', {
        channelName,
        retryCount,
        timestamp: new Date().toISOString()
      });

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
        .subscribe(status => {
          handleConnectionStateChange(status);

          if (status === 'CHANNEL_ERROR') {
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
                retryCount
              }
            };
            
            ErrorTracker.trackError(error, metadata);
            
            if (retryCount < MAX_RETRIES) {
              const delay = calculateBackoffDelay(retryCount);
              logger.info(LogCategory.COMMUNICATION, 'MessageRealtime', 'Scheduling retry', {
                retryCount,
                delay,
                messageId
              });
              
              setRetryCount(prev => prev + 1);
              
              toast({
                title: "Connection Error",
                description: `Reconnecting... (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
                variant: "destructive"
              });

              setTimeout(setupSubscription, delay);
            } else {
              // Set up fallback retry
              fallbackRetryRef.current = setInterval(() => {
                logger.info(LogCategory.COMMUNICATION, 'MessageRealtime', 'Attempting fallback retry', {
                  messageId,
                  timestamp: new Date().toISOString()
                });
                setupSubscription();
              }, FALLBACK_RETRY_INTERVAL);

              toast({
                title: "Connection Issues",
                description: "Attempting to reconnect in the background...",
                variant: "destructive"
              });
            }
          }
        });

      channelRef.current = channel;
      return channel;
    };

    const channel = setupSubscription();

    // Cleanup function
    return () => {
      logger.info(LogCategory.COMMUNICATION, 'MessageRealtime', 'Cleaning up subscription', {
        messageId,
        connectionStatus,
        timestamp: new Date().toISOString()
      });
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = undefined;
      }
      
      clearInterval(fallbackRetryRef.current);
      messageQueueRef.current = {}; // Clear message queue
    };
  }, [messageId, editedContent, setEditedContent, connectionStatus, retryCount, toast]);

  return {
    connectionStatus,
    lastUpdateTime,
    retryCount
  };
};