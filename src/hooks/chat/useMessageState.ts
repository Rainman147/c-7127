import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';

export const useMessageState = (initialContent: string, messageId?: string) => {
  const { toast } = useToast();
  const [editedContent, setEditedContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [wasEdited, setWasEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async (newContent: string) => {
    if (!messageId) {
      logger.error(LogCategory.ERROR, 'Message', 'Cannot save edit without message ID');
      return;
    }

    setIsSaving(true);
    const startTime = performance.now();
    
    logger.info(LogCategory.STATE, 'Message', 'Saving edited content:', { 
      messageId,
      contentLength: newContent.length,
      timestamp: new Date().toISOString(),
      performance: {
        startTime,
        heapSize: process.env.NODE_ENV === 'development' && performance?.memory ? 
          performance.memory.usedJSHeapSize : undefined
      }
    });

    // Optimistically update the content
    setEditedContent(newContent);
    setIsEditing(false);
    setWasEdited(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('edited_messages')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          edited_content: newContent
        }, {
          onConflict: 'message_id,user_id'
        });

      if (error) throw error;
      
      toast({
        description: "Changes saved successfully",
        className: "bg-[#10A37F] text-white",
      });

      logger.debug(LogCategory.STATE, 'Message', 'Save complete');
    } catch (error: any) {
      logger.error(LogCategory.ERROR, 'Message', 'Error saving edit:', error);
      
      // Revert optimistic update on error
      setEditedContent(initialContent);
      setWasEdited(false);
      
      toast({
        title: "Error saving changes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [messageId, initialContent, toast]);

  const handleCancel = useCallback(() => {
    logger.info(LogCategory.STATE, 'Message', 'Canceling edit:', { messageId });
    setEditedContent(initialContent);
    setIsEditing(false);
  }, [initialContent]);

  const handleEdit = useCallback(() => {
    logger.info(LogCategory.STATE, 'Message', 'Starting edit for message:', { messageId });
    if (!messageId) {
      logger.error(LogCategory.ERROR, 'Message', 'Cannot edit message without ID');
      return;
    }
    setIsEditing(true);
  }, [messageId]);

  return {
    editedContent,
    setEditedContent,
    isEditing,
    wasEdited,
    isSaving,
    handleSave,
    handleCancel,
    handleEdit
  };
};
