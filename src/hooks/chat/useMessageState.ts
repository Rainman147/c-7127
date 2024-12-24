import { useState, useCallback } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { ErrorTracker } from '@/utils/errorTracking';
import type { Message } from '@/types/chat';

export const useMessageState = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const handleError = useCallback((error: Error, operation: string) => {
    logger.error(LogCategory.STATE, 'useMessageState', `Error during ${operation}:`, {
      error,
      timestamp: new Date().toISOString(),
      retryCount,
      messageCount: messages.length
    });

    ErrorTracker.trackError(error, {
      component: 'useMessageState',
      operation,
      severity: retryCount >= MAX_RETRIES ? 'high' : 'medium',
      timestamp: new Date().toISOString()
    });

    toast({
      title: "Error",
      description: `Failed to ${operation}. ${retryCount < MAX_RETRIES ? 'Retrying...' : 'Please try again later.'}`,
      variant: "destructive",
    });
  }, [retryCount, messages.length, toast]);

  const updateMessages = useCallback((newMessages: Message[]) => {
    try {
      logger.debug(LogCategory.STATE, 'useMessageState', 'Updating messages:', { 
        count: newMessages.length,
        timestamp: new Date().toISOString()
      });
      setMessages(sortMessages(newMessages));
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      handleError(error as Error, 'update messages');
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        // Retry with exponential backoff
        setTimeout(() => updateMessages(newMessages), Math.pow(2, retryCount) * 1000);
      }
    }
  }, [handleError, retryCount]);

  const addOptimisticMessage = useCallback((content: string, type: 'text' | 'audio' = 'text') => {
    try {
      logger.debug(LogCategory.STATE, 'useMessageState', 'Adding optimistic message:', { 
        contentLength: content.length,
        type,
        timestamp: new Date().toISOString()
      });
      
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        type,
        sequence: messages.length,
        created_at: new Date().toISOString(),
        isOptimistic: true
      };

      setMessages(prev => sortMessages([...prev, optimisticMessage]));
      return optimisticMessage;
    } catch (error) {
      handleError(error as Error, 'add optimistic message');
      throw error; // Re-throw to handle in UI
    }
  }, [messages.length, handleError]);

  const replaceOptimisticMessage = useCallback((tempId: string, actualMessage: Message) => {
    try {
      logger.debug(LogCategory.STATE, 'useMessageState', 'Replacing optimistic message:', { 
        tempId,
        actualMessageId: actualMessage.id,
        timestamp: new Date().toISOString()
      });
      
      setMessages(prev => 
        sortMessages(prev.map(msg => 
          msg.id === tempId ? { ...actualMessage, isOptimistic: false } : msg
        ))
      );
    } catch (error) {
      handleError(error as Error, 'replace optimistic message');
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => replaceOptimisticMessage(tempId, actualMessage), Math.pow(2, retryCount) * 1000);
      }
    }
  }, [handleError, retryCount]);

  const clearMessages = useCallback(() => {
    try {
      logger.debug(LogCategory.STATE, 'useMessageState', 'Clearing messages', {
        timestamp: new Date().toISOString()
      });
      setMessages([]);
      setRetryCount(0);
    } catch (error) {
      handleError(error as Error, 'clear messages');
    }
  }, [handleError]);

  return {
    messages,
    updateMessages,
    addOptimisticMessage,
    replaceOptimisticMessage,
    clearMessages,
    setMessages,
    retryCount
  };
};

const sortMessages = (messages: Message[]) => {
  return [...messages].sort((a, b) => {
    if (a.sequence !== b.sequence) {
      return (a.sequence || 0) - (b.sequence || 0);
    }
    return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
  });
};