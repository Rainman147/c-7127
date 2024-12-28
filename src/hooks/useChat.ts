import { useCallback, useState } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { useToast } from '@/hooks/use-toast';
import type { ErrorMetadata } from '@/types/errorTracking';
import type { Message } from '@/types/chat';

export const useChat = (sessionId: string | null) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error: Error, operation: string) => {
    logger.error(LogCategory.COMMUNICATION, 'useChat', `Error during ${operation}:`, {
      error,
      sessionId,
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      stackTrace: error.stack
    });

    const metadata: ErrorMetadata = {
      component: 'useChat',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      errorType: 'runtime',
      operation,
      additionalInfo: {
        sessionId,
        messageCount: messages.length,
        isLoading,
        error: error.message
      }
    };

    ErrorTracker.trackError(error, metadata);

    toast({
      title: "Chat Error",
      description: "An error occurred. Please try again.",
      variant: "destructive",
    });
  }, [toast, sessionId, messages.length, isLoading]);

  const handleSendMessage = useCallback(async (message: string, type: 'text' | 'audio' = 'text') => {
    if (!sessionId) {
      logger.warn(LogCategory.STATE, 'useChat', 'Attempted to send message without session ID');
      return;
    }
    
    logger.info(LogCategory.COMMUNICATION, 'useChat', 'Initiating message send:', {
      sessionId,
      type,
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });

    setIsLoading(true);
    try {
      // Add message implementation here
      const newMessage: Message = {
        id: crypto.randomUUID(),
        content: message,
        role: 'user',
        type,
        sequence: messages.length + 1,
        created_at: new Date().toISOString()
      };

      logger.debug(LogCategory.STATE, 'useChat', 'Created new message:', {
        messageId: newMessage.id,
        sequence: newMessage.sequence,
        timestamp: new Date().toISOString()
      });

      setMessages(prev => {
        logger.debug(LogCategory.STATE, 'useChat', 'Updating messages state:', {
          previousCount: prev.length,
          newCount: prev.length + 1,
          timestamp: new Date().toISOString()
        });
        return [...prev, newMessage];
      });

    } catch (error) {
      handleError(error as Error, 'sendMessage');
    } finally {
      setIsLoading(false);
      logger.debug(LogCategory.STATE, 'useChat', 'Message send completed', {
        sessionId,
        timestamp: new Date().toISOString(),
        success: !isLoading
      });
    }
  }, [sessionId, messages, handleError]);

  return {
    messages,
    isLoading,
    handleSendMessage,
    handleError
  };
};