export interface ErrorMetadata {
  component: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  operation: string;  // Added operation property
  additionalInfo?: Record<string, unknown>;
}