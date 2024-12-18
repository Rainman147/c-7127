import { functionExamples } from './functionExamples';
import type { FunctionMapping } from './types';
import type { AIFunction } from '@/types/functionCalls';

interface ExtractedParameters {
  function: string;
  parameters: Record<string, any>;
  missingRequired: string[];
  clarificationNeeded: boolean;
}

export const extractParameters = (
  userInput: string,
  context?: Record<string, any>
): ExtractedParameters => {
  console.log('Extracting parameters from:', userInput);
  
  // Identify the function based on natural language patterns
  const identifiedFunction = identifyFunction(userInput);
  
  if (!identifiedFunction) {
    console.log('No function identified for input:', userInput);
    return {
      function: '',
      parameters: {},
      missingRequired: [],
      clarificationNeeded: true
    };
  }

  const functionConfig = functionExamples[identifiedFunction];
  const extractedParams: Record<string, any> = {};
  const missingRequired: string[] = [];

  // Extract parameters from user input and context
  functionConfig.parameters.forEach(param => {
    if (param.required) {
      const value = extractParameterValue(userInput, param.name) || context?.[param.name];
      if (value) {
        extractedParams[param.name] = value;
        console.log(`Extracted ${param.name}:`, value);
      } else {
        missingRequired.push(param.name);
        console.log(`Missing required parameter: ${param.name}`);
      }
    } else {
      // Handle optional parameters
      const value = extractParameterValue(userInput, param.name) || context?.[param.name];
      if (value) {
        extractedParams[param.name] = value;
        console.log(`Extracted optional ${param.name}:`, value);
      }
    }
  });

  return {
    function: identifiedFunction,
    parameters: extractedParams,
    missingRequired,
    clarificationNeeded: missingRequired.length > 0
  };
};

const identifyFunction = (input: string): string | null => {
  const normalizedInput = input.toLowerCase();
  
  for (const [funcName, config] of Object.entries(functionExamples)) {
    // Check if input contains function name or description keywords
    if (
      normalizedInput.includes(funcName.toLowerCase()) ||
      normalizedInput.includes(config.description.toLowerCase())
    ) {
      console.log(`Identified function: ${funcName}`);
      return funcName;
    }
  }
  
  return null;
};

const extractParameterValue = (input: string, paramName: string): string | null => {
  // Enhanced parameter extraction patterns
  const patterns: Record<string, RegExp> = {
    templateName: /(?:template|called|named)[:\s]+([a-zA-Z0-9\s]+?)(?=\s*(?:with|$))/i,
    content: /content[:\s]+([^\.]+)/i,
    instructions: /instructions[:\s]+([^\.]+)/i,
    schema: /schema[:\s]+([^\.]+)/i,
    firstName: /first name[:\s]+([a-zA-Z]+)/i,
    lastName: /last name[:\s]+([a-zA-Z]+)/i,
    patientName: /(?:patient|for|with)\s+([a-zA-Z]+\s+[a-zA-Z]+)/i,
    dateOfBirth: /(\d{4}-\d{2}-\d{2})/,
    medicalRecordNumber: /mrn[:\s]+([a-zA-Z0-9]+)/i,
    patientId: /patient[:\s]+([a-zA-Z0-9-]+)/i,
    query: /search[:\s]+([^,\.]+)/i,
    visitType: /visit type[:\s]+([a-zA-Z\s]+)/i,
    format: /format[:\s]+([a-zA-Z\s]+)/i,
    destination: /destination[:\s]+([a-zA-Z\s]+)/i
  };

  const pattern = patterns[paramName];
  if (!pattern) {
    console.log(`No pattern defined for parameter: ${paramName}`);
    return null;
  }

  const match = input.match(pattern);
  const value = match ? match[1].trim() : null;
  console.log(`Extracting ${paramName}:`, value);
  return value;
};

export const getClarificationPrompt = (
  functionName: string,
  missingParam: string
): string => {
  const func = functionExamples[functionName];
  const param = func.parameters.find(p => p.name === missingParam);
  return param?.description || `Please provide the ${missingParam}`;
};