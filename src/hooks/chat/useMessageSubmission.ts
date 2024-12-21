import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { extractParameters } from "@/utils/functionMapping/parameterExtractor";
import { useFunctionCalling } from "@/hooks/useFunctionCalling";

interface UseMessageSubmissionProps {
  onSend: (message: string, type?: 'text' | 'audio') => void;
}

export const useMessageSubmission = ({ onSend }: UseMessageSubmissionProps) => {
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const { handleFunctionCall, isProcessing } = useFunctionCalling();

  const handleSubmit = async () => {
    if (message.trim() && !isProcessing) {
      console.log('[useMessageSubmission] Submitting message:', message);
      
      // Send the message immediately to improve responsiveness
      onSend(message, 'text');
      setMessage("");
      
      // Try to extract function call parameters
      const extracted = extractParameters(message);
      console.log('[useMessageSubmission] Extracted parameters:', extracted);

      if (extracted.function && !extracted.clarificationNeeded) {
        try {
          // Handle function call asynchronously without blocking
          handleFunctionCall(extracted.function, extracted.parameters)
            .then(result => {
              console.log('[useMessageSubmission] Function call result:', result);
              if (result) {
                // Send function result as a separate message
                onSend(JSON.stringify(result, null, 2), 'text');
              }
            })
            .catch(error => {
              console.error('[useMessageSubmission] Function call error:', error);
              toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
              });
            });
        } catch (error: any) {
          console.error('[useMessageSubmission] Function call setup error:', error);
        }
      } else if (extracted.clarificationNeeded) {
        // Handle missing parameters with a toast notification
        const missingParams = extracted.missingRequired.join(', ');
        toast({
          title: "Missing Information",
          description: `Please provide: ${missingParams}`,
          duration: 5000,
        });
      }
    }
  };

  return {
    message,
    setMessage,
    handleSubmit,
    isProcessing
  };
};