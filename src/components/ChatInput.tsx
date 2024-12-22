import { useMessageSubmission } from "@/hooks/chat/useMessageSubmission";
import { useTranscriptionHandler } from "@/hooks/chat/useTranscriptionHandler";
import ChatInputField from "./chat/ChatInputField";
import ChatInputActions from "./chat/ChatInputActions";
import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio') => void;
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
  isLoading?: boolean;
}

const ChatInput = ({ 
  onSend, 
  onTranscriptionComplete,
  onTranscriptionUpdate,
  isLoading = false 
}: ChatInputProps) => {
  console.log('[ChatInput] Rendering with props:', { isLoading });
  
  const [message, setMessage] = useState("");
  
  const {
    handleSubmit: originalHandleSubmit,
    isProcessing
  } = useMessageSubmission({ onSend });

  const {
    handleTranscriptionComplete,
    handleFileUpload
  } = useTranscriptionHandler({
    onTranscriptionComplete,
    setMessage
  });

  const handleSubmit = async () => {
    console.log('[ChatInput] Handling submit with message:', message);
    if (message.trim()) {
      originalHandleSubmit();
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isProcessing) {
      console.log('[ChatInput] Enter key pressed, submitting message');
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleMessageChange = (newMessage: string) => {
    console.log('[ChatInput] Message changed:', { length: newMessage.length });
    setMessage(newMessage);
  };

  const isDisabled = isLoading || isProcessing;
  console.log('[ChatInput] Component state:', { isDisabled, messageLength: message.length });

  return (
    <div className="relative flex w-full flex-col items-center">
      <div className="w-full rounded-xl overflow-hidden bg-[#2F2F2F] border border-white/[0.05] shadow-lg">
        <ChatInputField
          message={message}
          setMessage={handleMessageChange}
          handleKeyDown={handleKeyDown}
          isLoading={isDisabled}
        />
        <ChatInputActions
          isLoading={isDisabled}
          message={message}
          handleSubmit={handleSubmit}
          onTranscriptionComplete={handleTranscriptionComplete}
          handleFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
};

export default ChatInput;