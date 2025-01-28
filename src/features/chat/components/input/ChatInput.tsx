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
}

const ChatInput = ({ 
  onSend, 
  onTranscriptionComplete,
  onTranscriptionUpdate,
  isLoading = false 
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      console.log('[ChatInput] Sending message:', { 
        message: message.trim(),
        isLoading 
      });
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTranscriptionComplete = (transcription: string) => {
    console.log('[ChatInput] Transcription complete:', { transcription });
    setMessage(transcription);
    onTranscriptionComplete(transcription);
    
    toast({
      title: "Transcription complete",
      description: "Your audio has been transcribed. Review and edit before sending.",
      duration: 3000,
    });
  };

  const handleFileUpload = async (file: File) => {
    console.log('[ChatInput] File uploaded:', { 
      fileName: file.name,
      fileSize: file.size 
    });
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-[#2F2F2F]">
      <ChatInputField
        message={message}
        setMessage={setMessage}
        handleKeyDown={handleKeyDown}
        isLoading={isLoading}
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

export default ChatInput;