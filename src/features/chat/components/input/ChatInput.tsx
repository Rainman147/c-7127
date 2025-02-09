
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AudioControls from "../audio/AudioControls";
import ChatInputField from "./ChatInputField";
import ChatInputActions from "./ChatInputActions";

interface ChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio') => void;
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
  isLoading?: boolean;
  draftMessage?: string;
  onDraftChange?: (draft: string) => void;
}

const ChatInput = ({ 
  onSend, 
  onTranscriptionComplete,
  onTranscriptionUpdate,
  isLoading = false,
  draftMessage = '',
  onDraftChange
}: ChatInputProps) => {
  const [message, setMessage] = useState(draftMessage);
  const [directMode, setDirectMode] = useState(false);
  const { toast } = useToast();

  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage);
    onDraftChange?.(newMessage);
  };

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      console.log('[DEBUG][ChatInput] Submitting message:', { 
        messageLength: message.trim().length,
        isLoading,
        timestamp: new Date().toISOString(),
        mode: directMode ? 'direct' : 'context'
      });
      
      onSend(message, 'text');
      setMessage("");
      
      console.log('[DEBUG][ChatInput] Message submitted and cleared');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      console.log('[DEBUG][ChatInput] Enter key pressed:', {
        isLoading,
        hasMessage: !!message.trim()
      });
      
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTranscriptionComplete = (transcription: string) => {
    console.log('[DEBUG][ChatInput] Transcription complete:', { 
      transcriptionLength: transcription.length 
    });
    
    handleMessageChange(transcription);
    onTranscriptionComplete(transcription);
    
    toast({
      title: "Transcription complete",
      description: "Your audio has been transcribed. Review and edit before sending.",
      duration: 3000,
    });
  };

  const handleFileUpload = async (file: File) => {
    console.log('[DEBUG][ChatInput] File upload:', { 
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
  };

  const handleDirectModeToggle = () => {
    setDirectMode(!directMode);
    toast({
      title: `Switched to ${!directMode ? 'Direct' : 'Context'} Mode`,
      description: !directMode 
        ? "Messages will be sent directly to AI without context" 
        : "Messages will include context and template information",
      duration: 3000,
    });
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-[#2F2F2F]">
      <ChatInputField
        message={message}
        setMessage={handleMessageChange}
        handleKeyDown={handleKeyDown}
        isLoading={isLoading}
      />
      <ChatInputActions
        isLoading={isLoading}
        message={message}
        handleSubmit={handleSubmit}
        onTranscriptionComplete={handleTranscriptionComplete}
        handleFileUpload={handleFileUpload}
        directMode={directMode}
        onDirectModeToggle={handleDirectModeToggle}
      />
    </div>
  );
};

export default ChatInput;
