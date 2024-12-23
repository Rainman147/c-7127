import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import type { DatabaseMessage } from '@/types/database/messages';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const useMessageRealtime = (
  messageId: string | undefined,
  editedContent: string,
  setEditedContent: (content: string) => void
) => {
  useEffect(() => {
    if (!messageId) return;

    logger.debug(LogCategory.COMMUNICATION, 'Message', 'Setting up real-time subscription for message:', { messageId });
    
    const channel = supabase
      .channel(`message-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `id=eq.${messageId}`
        },
        (payload: RealtimePostgresChangesPayload<DatabaseMessage>) => {
          logger.debug(LogCategory.COMMUNICATION, 'Message', 'Received real-time update:', payload);
          const newData = payload.new as DatabaseMessage;
          if (newData && newData.content !== editedContent) {
            setEditedContent(newData.content);
          }
        }
      )
      .subscribe(status => {
        logger.debug(LogCategory.COMMUNICATION, 'Message', 'Subscription status:', status);
      });

    return () => {
      logger.debug(LogCategory.COMMUNICATION, 'Message', 'Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [messageId, editedContent, setEditedContent]);
};