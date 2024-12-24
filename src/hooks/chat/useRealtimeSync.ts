import { useCallback, useRef } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { ErrorTracker } from '@/utils/errorTracking';
import type { Message } from '@/types/chat';

interface RealtimeSyncConfig {
  setMessages: (updater: (prev: Message[]) => Message[]) => void;
  onError?: (error: Error) => void;
  retryConfig?: {
    retryDelay: number;
    maxRetries: number;
  };
}

const DEFAULT_RETRY_CONFIG = {
  retryDelay: 1000,
  maxRetries: 3
};

export const useRealtimeSync = ({ 
  setMessages, 
  onError,
  retryConfig = DEFAULT_RETRY_CONFIG
}: RealtimeSyncConfig) => {
  const { toast } = useToast();
  const pendingMessagesRef = useRef<Message[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageUpdateTimeRef = useRef<number>(Date.now());
  const retryCountRef = useRef<number>(0);
  const isRecoveringRef = useRef<boolean>(false);

  const handleSyncError = useCallback((error: Error) => {
    logger.error(LogCategory.ERROR, 'useRealtimeSync', 'State sync error:', {
      error,
      retryCount: retryCountRef.current,
      pendingMessages: pendingMessagesRef.current.length,
      isRecovering: isRecoveringRef.current
    });

    ErrorTracker.trackError(error, {
      component: 'useRealtimeSync',
      errorType: 'SyncError',
      severity: 'high',
      timestamp: new Date().toISOString(),
      additionalInfo: {
        retryCount: retryCountRef.current,
        pendingMessages: pendingMessagesRef.current.length
      }
    });

    if (retryCountRef.current < retryConfig.maxRetries && !isRecoveringRef.current) {
      isRecoveringRef.current = true;
      retryCountRef.current++;
      
      const delay = retryConfig.retryDelay * Math.pow(2, retryCountRef.current - 1);
      
      toast({
        title: "Connection Issue",
        description: `Attempting to recover (${retryCountRef.current}/${retryConfig.maxRetries})...`,
        duration: delay
      });

      setTimeout(() => {
        isRecoveringRef.current = false;
        processBatch();
      }, delay);
    } else {
      toast({
        title: "Sync Error",
        description: "Failed to sync messages after multiple attempts. Please refresh the page.",
        variant: "destructive"
      });
      onError?.(error);
    }
  }, [toast, onError, retryConfig]);

  const processBatch = useCallback(() => {
    if (pendingMessagesRef.current.length === 0) return;

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
          totalMessages: prev.length + uniqueMessages.length,
          isRecovering: isRecoveringRef.current
        });

        return [...prev, ...uniqueMessages];
      });

      pendingMessagesRef.current = [];
      messageUpdateTimeRef.current = Date.now();
      
      if (isRecoveringRef.current) {
        isRecoveringRef.current = false;
        retryCountRef.current = 0;
        toast({
          title: "Connection Recovered",
          description: "Successfully synchronized messages",
          variant: "default"
        });
      }
    } catch (error) {
      handleSyncError(error as Error);
    }
  }, [setMessages, handleSyncError, toast]);

  const handleNewMessage = useCallback((newMessage: Message) => {
    const currentTime = Date.now();
    
    try {
      if (currentTime - messageUpdateTimeRef.current < 50) {
        pendingMessagesRef.current.push(newMessage);
        
        logger.debug(LogCategory.STATE, 'useRealtimeSync', 'Queuing message for batch:', {
          messageId: newMessage.id,
          pendingCount: pendingMessagesRef.current.length,
          isRecovering: isRecoveringRef.current
        });

        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
        }

        batchTimeoutRef.current = setTimeout(processBatch, 100);
        return;
      }

      setMessages(prev => {
        const isDuplicate = prev.some(msg => msg.id === newMessage.id);
        if (isDuplicate) {
          logger.debug(LogCategory.STATE, 'useRealtimeSync', 'Skipping duplicate message:', {
            messageId: newMessage.id
          });
          return prev;
        }

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
    retryCountRef.current = 0;
    isRecoveringRef.current = false;
  }, []);

  return {
    handleNewMessage,
    cleanup,
    isRecovering: isRecoveringRef.current,
    retryCount: retryCountRef.current
  };
};