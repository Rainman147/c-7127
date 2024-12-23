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
    console.log('[useMessageHandling] Starting message send operation:', { 
      contentLength: content.length,
      type,
      chatId,
      existingMessagesCount: existingMessages.length,
      hasSystemInstructions: !!systemInstructions
    });

    if (!content.trim()) {
      const error = new Error('Message content cannot be empty');
      console.error('[useMessageHandling] Validation error:', error);
      throw error;
    }

    if (!chatId) {
      const error = new Error('Chat ID is required');
      console.error('[useMessageHandling] Validation error:', error);
      throw error;
    }

    setIsLoading(true);
    console.log('[useMessageHandling] Set loading state to true');

    try {
      const nextSequence = existingMessages.length + 1;
      console.log('[useMessageHandling] Calculated next sequence:', nextSequence);

      console.log('[useMessageHandling] Inserting user message to database');
      const userMessage = await insertUserMessage(chatId, content, type, nextSequence);
      
      console.log('[useMessageHandling] Fetching updated messages');
      const messages = await fetchMessages(chatId);
      
      console.log('[useMessageHandling] Transforming messages:', {
        fetchedCount: messages.length,
        sequences: messages.map(m => m.sequence)
      });
      const transformedMessages = transformDatabaseMessages(messages);

      console.log('[useMessageHandling] Operation complete successfully:', {
        messageCount: transformedMessages.length,
        sequences: transformedMessages.map(m => m.sequence)
      });

      return {
        messages: transformedMessages,
        userMessage: transformDatabaseMessage(userMessage)
      };

    } catch (error: any) {
      console.error('[useMessageHandling] Error in message operation:', {
        error: error.message,
        stack: error.stack
      });
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      console.log('[useMessageHandling] Resetting loading state');
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSendMessage
  };
};