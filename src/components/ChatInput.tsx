import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ChatInputField from "./chat/ChatInputField";
import ChatInputActions from "./chat/ChatInputActions";
import ModelSelector from "./chat/ModelSelector";

type ModelType = 'gemini' | 'gpt4o' | 'gpt4o-mini';

interface ChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio', model?: ModelType) => void;
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
  const [currentModel, setCurrentModel] = useState<ModelType>('gemini');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSend(message, 'text', currentModel);
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
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700">
          <ModelSelector
            currentModel={currentModel}
            onModelChange={setCurrentModel}
            isDisabled={isLoading}
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
    </div>
  );
};

export default ChatInput;