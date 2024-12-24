export interface ErrorMetadata {
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  errorType: string;
  operation?: string;
  additionalInfo?: Record<string, unknown>;
}