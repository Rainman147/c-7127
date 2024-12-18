export type FunctionExample = {
  naturalLanguage: string[];
  requiredParameters: string[];
  optionalParameters?: string[];
  clarificationPrompts: Record<string, string>;
};

export type FunctionMapping = {
  [key: string]: FunctionExample;
};