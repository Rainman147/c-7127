import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { Message, MessageStatus } from '@/types/chat';

export const useMessageLoading = () => {
  const loadMessages = useCallback(async (sessionId: string): Promise<Message[]> => {
    logger.info(LogCategory.STATE, 'useMessageLoading', 'Starting message load:', {
      sessionId,
      timestamp: new Date().toISOString(),
      performance: {
        now: performance.now()
      }
    });

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error(LogCategory.ERROR, 'useMessageLoading', 'Database query failed:', {
          sessionId,
          error,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      logger.debug(LogCategory.STATE, 'useMessageLoading', 'Raw messages received:', {
        sessionId,
        count: messages?.length || 0,
        messageIds: messages?.map(m => m.id),
        timestamp: new Date().toISOString()
      });

      const transformedMessages = messages.map((msg, index) => {
        const status: MessageStatus = (msg.status as MessageStatus) || 'queued';
        return {
          id: msg.id,
          role: msg.sender as 'user' | 'assistant',
          content: msg.content,
          type: msg.type as 'text' | 'audio',
          sequence: msg.sequence ?? index,
          created_at: msg.created_at,
          status
        };
      });

      logger.info(LogCategory.STATE, 'useMessageLoading', 'Messages transformed:', {
        sessionId,
        count: transformedMessages.length,
        messages: transformedMessages.map(m => ({
          id: m.id,
          sequence: m.sequence,
          role: m.role,
          status: m.status,
          contentPreview: m.content.substring(0, 50)
        })),
        timestamp: new Date().toISOString()
      });

      return transformedMessages;
    } catch (error) {
      logger.error(LogCategory.ERROR, 'useMessageLoading', 'Message loading failed:', {
        sessionId,
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, []);

  return {
    loadMessages
  };
};