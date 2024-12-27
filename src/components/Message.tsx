import { memo } from 'react';
import MessageContainer from './message/MessageContainer';
import { useMessageState } from './message/useMessageState';
import { useMessageRealtime } from './message/useMessageRealtime';
import { useTypingEffect } from './message/useTypingEffect';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import type { MessageProps } from './message/types';

const Message = memo(({ 
  role, 
  content, 
  isStreaming, 
  type, 
  id,
  showAvatar = true 
}: MessageProps) => {
  const { toast } = useToast();
  
  logger.debug(LogCategory.RENDER, 'Message', 'Rendering message:', {
    id,
    role,
    contentLength: content?.length,
    isStreaming,
    type,
    timestamp: new Date().toISOString()
  });

  const {
    editedContent,
    setEditedContent,
    isEditing,
    wasEdited,
    isSaving,
    handleSave,
    handleCancel,
    handleEdit
  } = useMessageState(content, id);

  const { connectionState, lastUpdateTime } = useMessageRealtime(
    id, 
    editedContent, 
    setEditedContent,
    `message-${id}` // Add unique componentId for this message instance
  );

  const { isTyping } = useTypingEffect(role, isStreaming, content);

  // Enhanced connection state logging and handling
  logger.debug(LogCategory.STATE, 'Message', 'Message state:', {
    id,
    isEditing,
    wasEdited,
    isSaving,
    connectionStatus: connectionState.status,
    lastUpdateTime,
    isTyping,
    timestamp: new Date().toISOString()
  });

  // Show reconnection success toast with more context
  if (connectionState.status === 'connected' && connectionState.retryCount > 0) {
    logger.info(LogCategory.STATE, 'Message', 'Reconnected after retries:', {
      messageId: id,
      retryCount: connectionState.retryCount
    });
    
    toast({
      title: "Connection Restored",
      description: "Message synchronization resumed",
      className: "bg-green-500 text-white",
    });
  }

  // Show warning for disconnected state
  if (connectionState.status === 'disconnected' && connectionState.retryCount >= 5) {
    logger.warn(LogCategory.STATE, 'Message', 'Connection lost:', {
      messageId: id,
      retryCount: connectionState.retryCount
    });
    
    toast({
      title: "Connection Lost",
      description: "Unable to sync message changes. Please check your connection.",
      variant: "destructive",
    });
  }

  return (
    <MessageContainer
      role={role}
      content={content}
      isStreaming={isStreaming}
      type={type}
      id={id}
      showAvatar={showAvatar}
      editedContent={editedContent}
      isEditing={isEditing}
      wasEdited={wasEdited}
      isSaving={isSaving}
      isTyping={isTyping}
      onSave={handleSave}
      onCancel={handleCancel}
      onEdit={handleEdit}
    />
  );
});

Message.displayName = 'Message';

export default Message;