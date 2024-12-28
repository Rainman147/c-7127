import { memo } from 'react';
import ChatInputContainer from "./chat/ChatInputContainer";
import type { Message } from '@/types/chat';

interface ChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio') => Promise<Message>;
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
  isLoading?: boolean;
}

const ChatInput = memo(({ 
  onSend,
  onTranscriptionComplete,
  onTranscriptionUpdate,
  isLoading 
}: ChatInputProps) => {
  return (
    <ChatInputContainer 
      onSend={onSend}
      onTranscriptionComplete={onTranscriptionComplete}
      onTranscriptionUpdate={onTranscriptionUpdate}
      isLoading={isLoading}
    />
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;