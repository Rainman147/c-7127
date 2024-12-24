import { useCallback, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

interface RealtimeSyncConfig {
  setMessages: (updater: (prev: Message[]) => Message[]) => void;
  onError?: (error: Error) => void;
}

export const useRealtimeSync = ({ setMessages, onError }: RealtimeSyncConfig) => {
  const { toast } = useToast();
  const pendingMessagesRef = useRef<Message[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageUpdateTimeRef = useRef<number>(Date.now());
  const errorCountRef = useRef<number>(0);
  const lastErrorTimeRef = useRef<number>(0);

  const handleSyncError = useCallback((error: Error) => {
    const currentTime = Date.now();
    const timeSinceLastError = currentTime - lastErrorTimeRef.current;
    
    // Reset error count if more than 5 minutes have passed
    if (timeSinceLastError > 5 * 60 * 1000) {
      errorCountRef.current = 0;
    }

    errorCountRef.current++;
    lastErrorTimeRef.current = currentTime;

    logger.error(LogCategory.ERROR, 'useRealtimeSync', 'State sync error:', {
      error,
      errorCount: errorCountRef.current,
      timeSinceLastError,
      pendingMessages: pendingMessagesRef.current.length
    });

    // Show toast only for first error or after 5 minute cooldown
    if (errorCountRef.current === 1 || timeSinceLastError > 5 * 60 * 1000) {
      toast({
        title: "Sync Error",
        description: "There was an issue syncing messages. Retrying...",
        variant: "destructive"
      });
    }

    onError?.(error);
  }, [toast, onError]);

  const processBatch = useCallback(() => {
    if (pendingMessagesRef.current.length === 0) return;

    const batchSize = pendingMessagesRef.current.length;
    logger.debug(LogCategory.STATE, 'useRealtimeSync', 'Processing message batch:', {
      batchSize,
      timestamp: new Date().toISOString()
    });

    try {
      setMessages(prev => {
        const uniqueMessages = pendingMessagesRef.current.filter(
          newMsg => !prev.some(existingMsg => existingMsg.id === newMsg.id)
        );

        if (uniqueMessages.length === 0) {
          logger.debug(LogCategory.STATE, 'useRealtimeSync', 'No new unique messages in batch');
          return prev;
        }

        logger.debug(LogCategory.STATE, 'useRealtimeSync', 'Adding batch of messages:', {
          uniqueCount: uniqueMessages.length,
          totalMessages: prev.length + uniqueMessages.length
        });

        return [...prev, ...uniqueMessages];
      });

      pendingMessagesRef.current = [];
      messageUpdateTimeRef.current = Date.now();
      
      // Reset error count on successful sync
      if (errorCountRef.current > 0) {
        logger.info(LogCategory.STATE, 'useRealtimeSync', 'Successfully recovered from sync errors');
        errorCountRef.current = 0;
      }
    } catch (error) {
      handleSyncError(error as Error);
    }
  }, [setMessages, handleSyncError]);

  const handleNewMessage = useCallback((newMessage: Message) => {
    const currentTime = Date.now();
    
    try {
      if (currentTime - messageUpdateTimeRef.current < 50) {
        pendingMessagesRef.current.push(newMessage);
        
        logger.debug(LogCategory.STATE, 'useRealtimeSync', 'Queuing message for batch:', {
          messageId: newMessage.id,
          pendingCount: pendingMessagesRef.current.length,
          timeSinceLastUpdate: currentTime - messageUpdateTimeRef.current
        });

        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
        }

        batchTimeoutRef.current = setTimeout(() => {
          processBatch();
        }, 100);

        return;
      }

      // If enough time has passed, process immediately
      setMessages(prev => {
        const isDuplicate = prev.some(msg => msg.id === newMessage.id);
        if (isDuplicate) {
          logger.debug(LogCategory.STATE, 'useRealtimeSync', 'Skipping duplicate message:', {
            messageId: newMessage.id
          });
          return prev;
        }

        logger.debug(LogCategory.STATE, 'useRealtimeSync', 'Adding single message:', {
          messageId: newMessage.id,
          currentCount: prev.length,
          timeSinceLastUpdate: currentTime - messageUpdateTimeRef.current
        });

        messageUpdateTimeRef.current = currentTime;
        return [...prev, newMessage];
      });
    } catch (error) {
      handleSyncError(error as Error);
    }
  }, [setMessages, processBatch, handleSyncError]);

  const cleanup = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    pendingMessagesRef.current = [];
  }, []);

  return {
    handleNewMessage,
    cleanup
  };
};