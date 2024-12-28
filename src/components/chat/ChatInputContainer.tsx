import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMessageHandling } from '@/hooks/chat/useMessageHandling';
import ChatInputField from './input/ChatInputField';
import ChatInputActions from './input/ChatInputActions';
import { logger, LogCategory } from '@/utils/logging';

const ChatInputContainer = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { handleMessageSubmit } = useMessageHandling();

  const handleSetMessage = useCallback(async (newMessage: string) => {
    setMessage(newMessage);
  }, []);

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSubmit();
    }
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      await handleMessageSubmit(message);
      setMessage('');
    } catch (error) {
      logger.error(LogCategory.STATE, 'ChatInputContainer', 'Error submitting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      // File upload logic here
      logger.debug(LogCategory.STATE, 'ChatInputContainer', 'File uploaded:', file.name);
    } catch (error) {
      logger.error(LogCategory.STATE, 'ChatInputContainer', 'Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscriptionComplete = (text: string) => {
    setMessage(text);
  };

  return (
    <div className="flex flex-col gap-2 p-4 border-t border-gray-200 dark:border-gray-800">
      <ChatInputField
        message={message}
        setMessage={handleSetMessage}
        handleKeyDown={handleKeyDown}
        isLoading={isLoading}
        characterLimit={2000}
      />
      <ChatInputActions
        isLoading={isLoading}
        message={message}
        handleSubmit={handleSubmit}
        onTranscriptionComplete={handleTranscriptionComplete}
        handleFileUpload={handleFileUpload}
      />
    </div>
  );
};

export default ChatInputContainer;