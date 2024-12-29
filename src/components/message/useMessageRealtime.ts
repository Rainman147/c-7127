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
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);

  useEffect(() => {
    if (!messageId) return;

    const subscribeStartTime = performance.now();
    
    logger.debug(LogCategory.COMMUNICATION, 'Message', 'Setting up real-time subscription', { 
      messageId,
      subscribeStartTime,
      connectionStatus
    });
    
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
          const updateReceiveTime = performance.now();
          const latency = lastUpdateTime ? updateReceiveTime - lastUpdateTime : null;
          
          logger.debug(LogCategory.COMMUNICATION, 'Message', 'Received real-time update', {
            messageId,
            payload,
            updateReceiveTime,
            latency,
            connectionStatus
          });
          
          const newData = payload.new as DatabaseMessage;
          if (newData && newData.content !== editedContent) {
            setEditedContent(newData.content);
            setLastUpdateTime(updateReceiveTime);
          }
        }
      )
      .subscribe(status => {
        setConnectionStatus(status);
        logger.debug(LogCategory.COMMUNICATION, 'Message', 'Subscription status changed', { 
          status,
          messageId,
          setupDuration: performance.now() - subscribeStartTime
        });
      });

    return () => {
      logger.debug(LogCategory.COMMUNICATION, 'Message', 'Cleaning up real-time subscription', {
        messageId,
        finalConnectionStatus: connectionStatus,
        totalDuration: performance.now() - subscribeStartTime
      });
      supabase.removeChannel(channel);
    };
  }, [messageId, editedContent, setEditedContent, connectionStatus, lastUpdateTime]);

  return {
    connectionStatus,
    lastUpdateTime
  };
};