import { useState, useCallback, memo, useEffect } from 'react';
import MessageAvatar from './MessageAvatar';
import MessageActions from './MessageActions';
import MessageContent from './message/MessageContent';
import { logger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  type?: 'text' | 'audio';
  id?: string;
  showAvatar?: boolean;
};

const Message = memo(({ 
  role, 
  content, 
  isStreaming, 
  type, 
  id,
  showAvatar = true 
}: MessageProps) => {
  const { toast } = useToast();
  const [editedContent, setEditedContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [wasEdited, setWasEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Set up real-time subscription for message updates
  useEffect(() => {
    if (!id) return;

    logger.debug(LogCategory.COMMUNICATION, 'Message', 'Setting up real-time subscription for message:', { id });
    
    const channel = supabase
      .channel(`message-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `id=eq.${id}`
        },
        (payload) => {
          logger.debug(LogCategory.COMMUNICATION, 'Message', 'Received real-time update:', payload);
          if (payload.new && payload.new.content !== editedContent) {
            setEditedContent(payload.new.content);
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
  }, [id, editedContent]);

  // Simulate typing effect for AI responses
  useEffect(() => {
    if (role === 'assistant' && isStreaming) {
      setIsTyping(true);
      // Simulate natural typing timing
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
      }, content.length * 50); // Adjust timing based on content length

      return () => clearTimeout(typingTimeout);
    }
  }, [role, isStreaming, content]);

  const handleSave = useCallback(async (newContent: string) => {
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
  }, [id, toast]);

  const handleCancel = useCallback(() => {
    logger.info(LogCategory.STATE, 'Message', 'Canceling edit:', { messageId: id });
    setEditedContent(content);
    setIsEditing(false);
  }, [content]);

  const handleEdit = useCallback(() => {
    logger.info(LogCategory.STATE, 'Message', 'Starting edit for message:', { id });
    if (!id) {
      logger.error(LogCategory.ERROR, 'Message', 'Cannot edit message without ID');
      return;
    }
    setIsEditing(true);
  }, [id]);

  return (
    <div className={`group transition-opacity duration-300 ${isStreaming ? 'opacity-70' : 'opacity-100'}`}>
      <div className={`flex gap-4 max-w-4xl mx-auto ${role === 'user' ? 'flex-row-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-8 h-8 ${!showAvatar && 'invisible'}`}>
          <MessageAvatar isAssistant={role === 'assistant'} />
        </div>
        <div className={`flex-1 space-y-2 ${role === 'user' ? 'flex flex-col items-end' : ''}`}>
          <MessageContent 
            role={role}
            content={editedContent}
            type={type}
            isStreaming={isStreaming}
            isEditing={isEditing}
            id={id}
            wasEdited={wasEdited}
            isSaving={isSaving}
            isTyping={isTyping}
            onSave={handleSave}
            onCancel={handleCancel}
          />
          {role === 'assistant' && id && (
            <MessageActions 
              content={editedContent}
              messageId={id}
              onEdit={handleEdit}
            />
          )}
        </div>
      </div>
    </div>
  );
});

Message.displayName = 'Message';

export default Message;