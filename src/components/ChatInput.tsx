import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFunctionCalling } from "@/hooks/useFunctionCalling";
import { extractParameters } from "@/utils/functionMapping/parameterExtractor";
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
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const { handleFunctionCall, isProcessing } = useFunctionCalling();

  const handleSubmit = async () => {
    if (message.trim() && !isLoading && !isProcessing) {
      // Try to extract function call parameters
      const extracted = extractParameters(message);
      console.log('[ChatInput] Extracted parameters:', extracted);

      if (extracted.function && !extracted.clarificationNeeded) {
        try {
          // Handle function call
          const result = await handleFunctionCall(extracted.function, extracted.parameters);
          console.log('[ChatInput] Function call result:', result);
          
          // Send both the original message and function result to chat
          onSend(message);
          onSend(JSON.stringify(result, null, 2), 'text');
        } catch (error: any) {
          console.error('[ChatInput] Function call error:', error);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
          });
        }
      } else if (extracted.clarificationNeeded) {
        // Handle missing parameters
        const missingParams = extracted.missingRequired.join(', ');
        toast({
          title: "Missing Information",
          description: `Please provide: ${missingParams}`,
          duration: 5000,
        });
      } else {
        // Regular message, no function call detected
        onSend(message);
      }
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isProcessing) {
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