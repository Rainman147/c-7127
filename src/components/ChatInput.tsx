import { useMessageSubmission } from "@/hooks/chat/useMessageSubmission";
import { useTranscriptionHandler } from "@/hooks/chat/useTranscriptionHandler";
import { useChatSessions } from "@/hooks/useChatSessions";
import ChatInputField from "./chat/ChatInputField";
import ChatInputActions from "./chat/ChatInputActions";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
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

  const ensureActiveSession = async () => {
    if (!activeSessionId && !isCreatingSession) {
      console.log('[ChatInput] Creating new session for message');
      setIsCreatingSession(true);
      
      try {
        const sessionId = await createSession('New Chat');
        if (sessionId) {
          console.log('[ChatInput] New session created:', sessionId);
          navigate(`/c/${sessionId}`);
        }
      } catch (error) {
        console.error('[ChatInput] Failed to create session:', error);
        toast({
          title: "Error",
          description: "Failed to create new chat session",
          variant: "destructive"
        });
      } finally {
        setIsCreatingSession(false);
      }
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isProcessing && !isCreatingSession) {
      e.preventDefault();
      await ensureActiveSession();
      handleSubmit();
    }
  };

  const handleMessageChange = async (newMessage: string) => {
    setMessage(newMessage);
    if (newMessage.length === 1) {
      await ensureActiveSession();
    }
  };

  return (
    <div className="relative flex w-full flex-col items-center">
      <div className="w-full rounded-xl overflow-hidden bg-[#2F2F2F] border border-white/[0.05] shadow-lg">
        <ChatInputField
          message={message}
          setMessage={handleMessageChange}
          handleKeyDown={handleKeyDown}
          isLoading={isLoading || isProcessing || isCreatingSession}
        />
        <ChatInputActions
          isLoading={isLoading || isProcessing || isCreatingSession}
          message={message}
          handleSubmit={async () => {
            await ensureActiveSession();
            handleSubmit();
          }}
          onTranscriptionComplete={handleTranscriptionComplete}
          handleFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
};

const ChatInput = ChatInputComponent;
export default ChatInput;