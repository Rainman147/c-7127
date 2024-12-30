import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger, LogCategory } from '@/utils/logging';
import { useMessageState } from '@/hooks/chat/useMessageState';
import type { DatabaseMessage } from '@/types/database/messages';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const useMessageRealtime = (
  messageId: string | undefined,
  initialContent: string,
  updateMessageContent: (messageId: string, content: string) => void
) => {
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [wasEdited, setWasEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
            updateMessageContent(messageId, newData.content);
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
  }, [messageId, editedContent, updateMessageContent, connectionStatus, lastUpdateTime]);

  return {
    connectionStatus,
    lastUpdateTime,
    editedContent,
    setEditedContent,
    isEditing,
    setIsEditing,
    wasEdited,
    setWasEdited,
    isSaving,
    setIsSaving
  };
};