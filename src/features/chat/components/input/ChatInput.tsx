import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTemplate } from "@/contexts/TemplateContext";
import AudioControls from "../audio/AudioControls";
import ChatInputField from "./ChatInputField";
import ChatInputActions from "./ChatInputActions";

interface ChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio', systemInstructions?: string) => void;
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
  const { currentTemplate } = useTemplate();

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      console.log('[ChatInput] Sending message with template instructions:', 
        currentTemplate?.systemInstructions ? 'Present' : 'Not provided');
      
      onSend(
        message, 
        'text',
        currentTemplate?.systemInstructions
      );
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
    console.log('Transcription complete in ChatInput:', transcription);
    setMessage(transcription);
    onTranscriptionComplete(transcription);
    
    toast({
      title: "Transcription complete",
      description: "Your audio has been transcribed. Review and edit before sending.",
      duration: 3000,
    });
  };

  const handleFileUpload = async (file: File) => {
    console.log('File uploaded:', file);
  };

  return (
    <div className="relative flex w-full flex-col items-center">
      <div className="w-full max-w-4xl rounded-3xl overflow-hidden bg-[#2F2F2F]">
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
    </div>
  );
};

export default ChatInput;