import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { AIFunction } from '@/types/functionCalls';

interface FunctionCallLog {
  timestamp: string;
  functionName: string;
  parameters: Record<string, unknown>;
  status: 'success' | 'error';
  result?: unknown;
  error?: string;
}

export const useFunctionCalling = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<FunctionCallLog[]>([]);

  const logFunctionCall = (
    functionName: string,
    parameters: Record<string, unknown>,
    status: 'success' | 'error',
    result?: unknown,
    error?: string
  ) => {
    const logEntry: FunctionCallLog = {
      timestamp: new Date().toISOString(),
      functionName,
      parameters,
      status,
      result,
      error
    };
    
    console.log(`[FunctionCall] ${status.toUpperCase()}:`, {
      function: functionName,
      parameters,
      result: result || error
    });
    
    setLogs(prevLogs => [...prevLogs, logEntry]);
  };

  const getFeedbackMessage = (
    functionName: string,
    result: any,
    parameters: Record<string, unknown>
  ): string => {
    switch (functionName) {
      case 'startLiveSession':
        return `Started a new live session${parameters.patientName ? ` for ${parameters.patientName}` : ''}.`;
      case 'createTemplate':
        return `Created new template: ${parameters.templateName}`;
      case 'addPatient':
        return `Added patient record for ${parameters.firstName} ${parameters.lastName}`;
      case 'searchHistory':
        return `Found ${result.total || 0} results for your search`;
      case 'fetchLastVisit':
        return result.lastVisitDate 
          ? `Last visit was on ${new Date(result.lastVisitDate).toLocaleDateString()}`
          : 'No previous visits found';
      default:
        return 'Operation completed successfully';
    }
  };

  const getErrorMessage = (
    functionName: string,
    error: Error,
    parameters: Record<string, unknown>
  ): string => {
    const baseError = error.message || 'An unexpected error occurred';
    
    switch (functionName) {
      case 'startLiveSession':
        return `Failed to start session: ${baseError}`;
      case 'createTemplate':
        return `Couldn't create template: ${baseError}`;
      case 'addPatient':
        return `Failed to add patient record: ${baseError}`;
      case 'searchHistory':
        return `Search failed: ${baseError}`;
      case 'fetchLastVisit':
        return `Couldn't retrieve visit history: ${baseError}`;
      default:
        return baseError;
    }
  };

  const handleFunctionCall = async (
    functionName: string,
    parameters: Record<string, unknown>
  ) => {
    setIsProcessing(true);
    console.log(`[FunctionCall] Processing function call: ${functionName}`, parameters);

    try {
      // Call the Supabase Edge Function named 'function-call'
      const { data, error } = await supabase.functions.invoke('function-call', {
        body: {
          function: functionName,
          parameters,
        }
      });

      if (error) throw error;
      if (!data) throw new Error('No response from function');

      // Log successful function call
      logFunctionCall(functionName, parameters, 'success', data);
      
      // Show success toast with contextual message
      toast({
        title: "Success",
        description: getFeedbackMessage(functionName, data, parameters),
        variant: "default",
      });

      console.log(`[FunctionCall] Function call successful:`, data);
      return data;
    } catch (error: any) {
      // Log failed function call
      logFunctionCall(functionName, parameters, 'error', undefined, error.message);
      
      // Show error toast with contextual message
      toast({
        title: "Error",
        description: getErrorMessage(functionName, error, parameters),
        variant: "destructive",
      });

      console.error('[FunctionCall] Error executing function:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleFunctionCall,
    isProcessing,
    logs,
  };
};