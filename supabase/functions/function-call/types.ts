export interface FunctionCallPayload {
  function: string;
  parameters: Record<string, unknown>;
}

export interface FunctionResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ErrorResponse {
  error: string;
}