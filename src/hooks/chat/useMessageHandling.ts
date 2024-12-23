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
    console.log('[useMessageHandling] Sending message:', { 
      contentLength: content.length,
      type,
      chatId,
      existingMessagesCount: existingMessages.length 
    });

    if (!content.trim()) {
      console.error('[useMessageHandling] Empty message content');
      throw new Error('Message content cannot be empty');
    }

    if (!chatId) {
      console.error('[useMessageHandling] No chat ID provided');
      throw new Error('Chat ID is required');
    }

    setIsLoading(true);

    try {
      const nextSequence = existingMessages.length + 1;
      
      console.log('[useMessageHandling] Calculated message metadata:', {
        sequence: nextSequence
      });

      const userMessage = await insertUserMessage(chatId, content, type, nextSequence);
      const messages = await fetchMessages(chatId);
      const transformedMessages = transformDatabaseMessages(messages);

      console.log('[useMessageHandling] Operation complete:', {
        messageCount: transformedMessages.length,
        sequences: transformedMessages.map(m => m.sequence)
      });

      return {
        messages: transformedMessages,
        userMessage: transformDatabaseMessage(userMessage)
      };

    } catch (error) {
      console.error('[useMessageHandling] Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSendMessage
  };
};