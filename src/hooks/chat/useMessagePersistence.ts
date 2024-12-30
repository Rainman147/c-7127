import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';
import { usePerformanceTracking } from './usePerformanceTracking';

export const useMessagePersistence = (sessionId: string | null) => {
  const { trackMessageProcessing } = usePerformanceTracking();

  const saveMessage = useCallback(async (
    content: string,
    type: 'text' | 'audio' = 'text',
    sequence: number
  ): Promise<Message> => {
    if (!sessionId) {
      throw new Error('No active session');
    }

    const perfTracker = trackMessageProcessing('save_message', {
      contentLength: content.length,
      type
    });

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          chat_id: sessionId,
          content,
          type,
          sender: 'user',
          sequence,
          status: 'delivered'
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(LogCategory.STATE, 'MessagePersistence', 'Message saved successfully:', {
        messageId: message.id,
        chatId: sessionId,
        type
      });

      perfTracker.complete({ success: true });

      return {
        ...message,
        role: message.sender as 'user' | 'assistant',
        status: message.status as Message['status'],
        type: message.type as 'text' | 'audio'
      };
    } catch (error) {
      perfTracker.complete({ success: false, error });
      throw error;
    }
  }, [sessionId, trackMessageProcessing]);

  return { saveMessage };
};