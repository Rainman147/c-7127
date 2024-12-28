import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/utils/logging';

export const useMessageStateManager = (content: string, id?: string) => {
  const { toast } = useToast();
  const [editedContent, setEditedContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [wasEdited, setWasEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (newContent: string) => {
    if (!id) {
      logger.error(LogCategory.ERROR, 'Message', 'Cannot save edit without message ID');
      return;
    }

    try {
      setIsSaving(true);
      logger.info(LogCategory.STATE, 'Message', 'Saving edited content:', { 
        messageId: id,
        contentLength: newContent.length
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('edited_messages')
        .upsert({
          message_id: id,
          user_id: user.id,
          edited_content: newContent
        }, {
          onConflict: 'message_id,user_id'
        });

      if (error) throw error;
      
      setEditedContent(newContent);
      setIsEditing(false);
      setWasEdited(true);
      
      toast({
        description: "Changes saved successfully",
        className: "bg-[#10A37F] text-white",
      });

      logger.debug(LogCategory.STATE, 'Message', 'Save complete');
    } catch (error: any) {
      logger.error(LogCategory.ERROR, 'Message', 'Error saving edit:', error);
      toast({
        title: "Error saving changes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    logger.info(LogCategory.STATE, 'Message', 'Canceling edit:', { id });
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleEdit = () => {
    logger.info(LogCategory.STATE, 'Message', 'Starting edit for message:', { id });
    if (!id) {
      logger.error(LogCategory.ERROR, 'Message', 'Cannot edit message without ID');
      return;
    }
    setIsEditing(true);
  };

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