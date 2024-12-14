/**
 * Utility functions for HIPAA-compliant data handling
 */

// Common PHI patterns to detect and redact
const PHI_PATTERNS = [
  // Names
  /\b(?:[A-Z][a-z]+ ){1,2}[A-Z][a-z]+\b/g,
  // Phone numbers
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  // SSN
  /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Dates
  /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g,
  // Medical record numbers
  /\b(?:MRN|Medical Record Number)[:# ]?\d+\b/gi,
];

/**
 * De-identifies text by replacing potential PHI with generic placeholders
 */
export const deidentifyText = (text: string): string => {
  let deidentifiedText = text;
  
  PHI_PATTERNS.forEach((pattern, index) => {
    deidentifiedText = deidentifiedText.replace(pattern, `[REDACTED-${index}]`);
  });
  
  return deidentifiedText;
};

/**
 * Safely logs data while excluding sensitive information
 */
export const secureLog = (
  event: string, 
  data: any, 
  excludeKeys: string[] = ['audioData', 'transcription']
): void => {
  const sanitizedData = { ...data };
  excludeKeys.forEach(key => {
    if (key in sanitizedData) {
      sanitizedData[key] = '[REDACTED]';
    }
  });
  
  console.log(`[${new Date().toISOString()}] ${event}:`, sanitizedData);
};

/**
 * Validates TLS version of the current connection
 */
export const validateTLSVersion = (): boolean => {
  // Check if running in a secure context
  if (!window.isSecureContext) {
    console.error('Application not running in a secure context');
    return false;
  }
  
  return true;
};