export interface ErrorMetadata {
  component: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  operation?: string;
  additionalInfo?: Record<string, unknown>;
}