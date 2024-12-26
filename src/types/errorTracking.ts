export interface ErrorMetadata {
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  errorType: string;
  operation?: string;
  additionalInfo?: Record<string, unknown>;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Utility function to validate error metadata
export function validateErrorMetadata(metadata: ErrorMetadata): void {
  const requiredFields = ['component', 'severity', 'timestamp', 'errorType'];
  const missingFields = requiredFields.filter(field => !(field in metadata));
  
  if (missingFields.length > 0) {
    throw new Error(`ErrorMetadata is missing required fields: ${missingFields.join(', ')}`);
  }
  
  if (!['low', 'medium', 'high', 'critical'].includes(metadata.severity)) {
    throw new Error(`Invalid severity level: ${metadata.severity}`);
  }
}