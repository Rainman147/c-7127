import React from 'react';
import { useChatInput } from '@/hooks/chat/useChatInput';
import { useMessageHandling } from '@/hooks/chat/useMessageHandling';
import { useRealTime } from '@/contexts/RealTimeContext';

interface ChatInputContainerProps {
  onSend: (message: string, type?: 'text' | 'audio') => Promise<void>;
  onTranscriptionComplete: (text: string) => void;
  isLoading?: boolean;
}

const ChatInputContainer = ({
  onSend,
  onTranscriptionComplete,
  isLoading = false
}: ChatInputContainerProps) => {
  const [message, setMessage] = React.useState("");
  const { connectionState } = useRealTime();

  const {
    handleSubmit: originalHandleSubmit,
    handleKeyDown,
    handleTranscriptionComplete
  } = useChatInput({
    onSend,
    onTranscriptionComplete,
    message,
    setMessage
  });

  const { handleMessageChange, handleSubmit } = useMessageHandling({
    onSend,
    message,
    setMessage,
    connectionState
  });

  return (
    <div>
      <textarea
        value={message}
        onChange={(e) => handleMessageChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="w-full min-h-[40px] max-h-[200px] resize-none bg-transparent px-4 py-3 focus:outline-none"
        disabled={isLoading}
      />
      <button onClick={handleSubmit} disabled={isLoading}>
        Send
      </button>
    </div>
  );
};

export default ChatInputContainer;
