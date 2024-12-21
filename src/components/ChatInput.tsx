import { useMessageSubmission } from "@/hooks/chat/useMessageSubmission";
import { useTranscriptionHandler } from "@/hooks/chat/useTranscriptionHandler";
import { useChatSessions } from "@/hooks/useChatSessions";
import ChatInputField from "./chat/ChatInputField";
import ChatInputActions from "./chat/ChatInputActions";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useCallback } from "react";

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
  const [searchParams] = useSearchParams();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  const {
    message,
    setMessage,
    handleSubmit: originalHandleSubmit,
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

  const ensureActiveSession = useCallback(async () => {
    if (!activeSessionId && !isCreatingSession) {
      console.log('[ChatInput] Creating new session for message');
      setIsCreatingSession(true);
      
      try {
        const templateType = searchParams.get('template') || 'live-patient-session';
        const sessionId = await createSession('New Chat', templateType);
        if (sessionId) {
          console.log('[ChatInput] New session created:', sessionId);
          
          // Preserve all existing query parameters when redirecting
          const queryParams = new URLSearchParams(searchParams);
          const queryString = queryParams.toString();
          navigate(`/c/${sessionId}${queryString ? `?${queryString}` : ''}`);
          return true;
        }
      } catch (error) {
        console.error('[ChatInput] Failed to create session:', error);
        toast({
          title: "Error",
          description: "Failed to create new chat session",
          variant: "destructive"
        });
        return false;
      } finally {
        setIsCreatingSession(false);
      }
    }
    return true;
  }, [activeSessionId, isCreatingSession, createSession, navigate, searchParams, toast]);

  const handleSubmit = async () => {
    const sessionCreated = await ensureActiveSession();
    if (sessionCreated) {
      originalHandleSubmit();
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isProcessing && !isCreatingSession) {
      e.preventDefault();
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