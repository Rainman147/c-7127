export type FunctionParameter = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
};

export type AIFunction = {
  name: string;
  description: string;
  parameters: FunctionParameter[];
  expectedOutput: {
    type: string;
    description: string;
    example: unknown;
  };
};