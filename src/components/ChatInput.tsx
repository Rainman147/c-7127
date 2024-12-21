import { useMessageSubmission } from "@/hooks/chat/useMessageSubmission";
import { useTranscriptionHandler } from "@/hooks/chat/useTranscriptionHandler";
import { useChatSessions } from "@/hooks/useChatSessions";
import ChatInputField from "./chat/ChatInputField";
import ChatInputActions from "./chat/ChatInputActions";

interface ChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio') => void;
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
  isLoading?: boolean;
}

const ChatInputComponent = ({ 
  onSend, 
  onTranscriptionComplete,
  onTranscriptionUpdate,
  isLoading = false 
}: ChatInputProps) => {
  const {
    message,
    setMessage,
    handleSubmit,
    isProcessing
  } = useMessageSubmission({ onSend });

  const { activeSessionId, createSession } = useChatSessions();

  const {
    handleTranscriptionComplete,
    handleFileUpload
  } = useTranscriptionHandler({
    onTranscriptionComplete,
    setMessage
  });

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isProcessing) {
      e.preventDefault();
      
      // Create a new session if none exists
      if (!activeSessionId) {
        console.log('[ChatInput] No active session, creating new one');
        await createSession('New Chat');
      }
      
      handleSubmit();
    }
  };

  const handleMessageChange = async (newMessage: string) => {
    // Create a new session when user starts typing if none exists
    if (newMessage.length === 1 && !activeSessionId) {
      console.log('[ChatInput] First character typed, creating new session');
      await createSession('New Chat');
    }
    setMessage(newMessage);
  };

  return (
    <div className="relative flex w-full flex-col items-center">
      <div className="w-full rounded-xl overflow-hidden bg-[#2F2F2F] border border-white/[0.05] shadow-lg">
        <ChatInputField
          message={message}
          setMessage={handleMessageChange}
          handleKeyDown={handleKeyDown}
          isLoading={isLoading || isProcessing}
        />
        <ChatInputActions
          isLoading={isLoading || isProcessing}
          message={message}
          handleSubmit={handleSubmit}
          onTranscriptionComplete={handleTranscriptionComplete}
          handleFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
};

const ChatInput = ChatInputComponent;
export default ChatInput;