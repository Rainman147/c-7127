import Message from './Message';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  speaker?: 'Physician' | 'Patient';
  timestamp?: string;
  confidence?: number;
  id: string;
};

interface MessageListProps {
  messages: Message[];
  onEditMessage?: (messageId: string, newContent: string) => void;
}

const MessageList = ({ messages, onEditMessage }: MessageListProps) => {
  const { toast } = useToast();

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      if (onEditMessage) {
        await onEditMessage(messageId, newContent);
        toast({
          title: "Message updated",
          description: "The transcription has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update the transcription. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto px-4">
        {messages.map((message) => (
          <Message
            key={message.id}
            {...message}
            onEdit={onEditMessage ? (newContent) => handleEditMessage(message.id, newContent) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default MessageList;