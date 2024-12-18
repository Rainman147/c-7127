import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import type { AIFunction } from '@/types/functionCalls';

export const useFunctionCalling = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFunctionCall = async (
    functionName: string,
    parameters: Record<string, unknown>
  ) => {
    setIsProcessing(true);
    console.log(`[useFunctionCalling] Processing function call: ${functionName}`, parameters);

    try {
      const response = await fetch('/api/function-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          function: functionName,
          parameters,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Function call failed');
      }

      console.log(`[useFunctionCalling] Function call successful:`, result);
      return result;
    } catch (error) {
      console.error('[useFunctionCalling] Error executing function:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to execute function",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleFunctionCall,
    isProcessing,
  };
};