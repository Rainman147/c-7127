import { useCallback, useState } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

export const useChat = (sessionId: string | null) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error: Error, operation: string) => {
    logger.error(LogCategory.COMMUNICATION, 'useChat', `Error during ${operation}:`, {
      error,
      timestamp: new Date().toISOString()
    });

    ErrorTracker.trackError(error, {
      component: 'useChat',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      errorType: error.name,
      operation,
      additionalInfo: {
        sessionId,
        messageCount: messages.length,
        isLoading
      }
    });

    toast({
      title: "Chat Error",
      description: "An error occurred. Please try again.",
      variant: "destructive",
    });
  }, [toast, sessionId, messages.length, isLoading]);

  const handleSendMessage = useCallback(async (message: string, type: 'text' | 'audio' = 'text') => {
    if (!sessionId) return;
    
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
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      handleError(error as Error, 'sendMessage');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, messages, handleError]);

  return {
    messages,
    isLoading,
    handleSendMessage,
    handleError
  };
};