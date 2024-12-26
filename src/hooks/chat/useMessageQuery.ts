import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { Message, MessageType } from '@/types/chat';

export const useMessageQuery = (chatId: string) => {
  const fetchMessages = async (): Promise<Message[]> => {
    logger.debug(LogCategory.STATE, 'useMessageQuery', 'Fetching messages for chat:', chatId);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error(LogCategory.STATE, 'useMessageQuery', 'Error fetching messages:', error.message);
      throw new Error(error.message);
    }

    // Convert database messages to Message type
    return data.map(msg => ({
      id: msg.id,
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
      type: msg.type as MessageType,
      sequence: msg.sequence,
      created_at: msg.created_at
    }));
  };

  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: fetchMessages,
  });
};