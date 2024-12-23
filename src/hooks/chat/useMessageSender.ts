import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

export const useMessageSender = (
  sendMessage: (content: string, type: 'text' | 'audio', chatId: string, messages: Message[], systemInstructions?: string) => Promise<any>,
  updateCache: (chatId: string, messages: Message[]) => void
) => {
  const { toast } = useToast();

  const handleSendMessage = useCallback(async (
    content: string,
    chatId: string,
    currentMessages: Message[],
    updateMessages: (messages: Message[]) => void,
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string
  ) => {
    console.log('[useMessageSender] Sending message:', { content, type, chatId });
    
    try {
      const result = await sendMessage(
        content,
        type,
        chatId,
        currentMessages,
        systemInstructions
      );

      if (result) {
        console.log('[useMessageSender] Message sent successfully');
        updateMessages(result.messages);
        updateCache(chatId, result.messages);
        return result;
      }
    } catch (error) {
      console.error('[useMessageSender] Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      throw error;
    }
  }, [sendMessage, updateCache, toast]);

  return {
    handleSendMessage
  };
};