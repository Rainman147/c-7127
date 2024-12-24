export interface ErrorMetadata {
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  operation: string;  // Making operation required since it's used everywhere
  additionalInfo?: Record<string, unknown>;
}