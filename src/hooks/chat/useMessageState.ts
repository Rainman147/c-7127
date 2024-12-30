import { useState, useCallback } from 'react';
import { useMessages } from '@/contexts/MessageContext';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';

export const useMessageState = () => {
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [wasEdited, setWasEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const messageContext = useMessages();

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async (newContent: string) => {
    setIsSaving(true);
    try {
      logger.info(LogCategory.STATE, 'MessageState', 'Saving message:', {
        contentLength: newContent.length,
        timestamp: new Date().toISOString()
      });

      await new Promise(resolve => setTimeout(resolve, 500)); // Simulated save delay
      setWasEdited(true);
      setIsEditing(false);

      logger.debug(LogCategory.STATE, 'MessageState', 'Message saved successfully', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(LogCategory.STATE, 'MessageState', 'Error saving message:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedContent('');
  }, []);

  // Return both the message context properties and the editing state
  return {
    ...messageContext, // Spread all properties from MessageContext
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

export default useMessageState;