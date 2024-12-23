import { useMessageLoadingState } from './useMessageLoadingState';
import { useMessageDatabase } from './useMessageDatabase';
import { useMessageTransform } from './useMessageTransform';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

export const useMessageHandling = () => {
  const { isLoading, setIsLoading } = useMessageLoadingState();
  const { insertUserMessage, fetchMessages } = useMessageDatabase();
  const { transformDatabaseMessages, transformDatabaseMessage } = useMessageTransform();
  const { toast } = useToast();

  const handleSendMessage = async (
    content: string,
    type: 'text' | 'audio',
    chatId: string,
    existingMessages: Message[] = [],
    systemInstructions?: string
  ) => {
    const startTime = performance.now();
    console.log('[useMessageHandling] Starting message operation:', { 
      contentLength: content.length,
      type,
      chatId,
      existingMessagesCount: existingMessages.length,
      hasSystemInstructions: !!systemInstructions,
      timestamp: new Date().toISOString()
    });

    if (!content.trim()) {
      console.error('[useMessageHandling] Validation error: Empty content');
      throw new Error('Message content cannot be empty');
    }

    if (!chatId) {
      console.error('[useMessageHandling] Validation error: Missing chat ID');
      throw new Error('Chat ID is required');
    }

    setIsLoading(true);
    console.log('[useMessageHandling] State transition: Loading started');

    try {
      const nextSequence = existingMessages.length + 1;
      console.log('[useMessageHandling] Message preparation:', {
        nextSequence,
        timestamp: new Date().toISOString()
      });

      const dbStartTime = performance.now();
      console.log('[useMessageHandling] Database operation starting');
      
      const userMessage = await insertUserMessage(chatId, content, type, nextSequence);
      console.log('[useMessageHandling] User message inserted:', {
        messageId: userMessage.id,
        duration: `${(performance.now() - dbStartTime).toFixed(2)}ms`
      });
      
      const messages = await fetchMessages(chatId);
      console.log('[useMessageHandling] Messages fetched:', {
        count: messages.length,
        duration: `${(performance.now() - dbStartTime).toFixed(2)}ms`
      });
      
      const transformStartTime = performance.now();
      console.log('[useMessageHandling] Starting message transformation');
      
      const transformedMessages = transformDatabaseMessages(messages);
      console.log('[useMessageHandling] Messages transformed:', {
        inputCount: messages.length,
        outputCount: transformedMessages.length,
        duration: `${(performance.now() - transformStartTime).toFixed(2)}ms`
      });

      const totalDuration = performance.now() - startTime;
      console.log('[useMessageHandling] Operation completed successfully:', {
        totalDuration: `${totalDuration.toFixed(2)}ms`,
        messageCount: transformedMessages.length,
        timestamp: new Date().toISOString()
      });

      return {
        messages: transformedMessages,
        userMessage: transformDatabaseMessage(userMessage)
      };

    } catch (error: any) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      };
      
      console.error('[useMessageHandling] Operation failed:', errorDetails);
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      const finalDuration = performance.now() - startTime;
      console.log('[useMessageHandling] Cleanup:', {
        duration: `${finalDuration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSendMessage
  };
};