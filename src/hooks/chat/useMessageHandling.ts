import { supabase } from '@/integrations/supabase/client';
import { useMessageDatabase } from './useMessageDatabase';
import { useMessageTransform } from './useMessageTransform';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageHandling = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { saveMessage } = useMessageDatabase();
  const { transformMessage } = useMessageTransform();

  const handleSendMessage = async (
    content: string,
    type: 'text' | 'audio' = 'text',
    chatId: string,
    messages: Message[],
    systemInstructions?: string
  ) => {
    logger.info(LogCategory.COMMUNICATION, 'useMessageHandling', 'Sending message:', {
      contentLength: content.length,
      type,
      chatId
    });

    try {
      setIsLoading(true);

      // Save user message
      const userMessage = await saveMessage({
        content,
        type,
        chatId,
        role: 'user',
        sequence: messages.length
      });

      const updatedMessages = [...messages, userMessage];

      // Call Edge Function for AI response
      logger.debug(LogCategory.COMMUNICATION, 'useMessageHandling', 'Invoking chat function');
      
      const { data: aiResponse, error: functionError } = await supabase.functions.invoke('chat', {
        body: {
          message: content,
          chatId,
          systemInstructions,
          messageHistory: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (functionError) {
        logger.error(LogCategory.ERROR, 'useMessageHandling', 'Edge function error:', functionError);
        throw new Error('Failed to get AI response');
      }

      logger.debug(LogCategory.COMMUNICATION, 'useMessageHandling', 'Received AI response:', {
        responseLength: aiResponse?.content?.length
      });

      // Save AI response
      const assistantMessage = await saveMessage({
        content: aiResponse.content,
        type: 'text',
        chatId,
        role: 'assistant',
        sequence: updatedMessages.length
      });

      return {
        messages: [...updatedMessages, assistantMessage]
      };

    } catch (error) {
      logger.error(LogCategory.ERROR, 'useMessageHandling', 'Error handling message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSendMessage,
    isLoading
  };
};