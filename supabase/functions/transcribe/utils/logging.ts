export const secureLog = (event: string, data: any, excludeKeys: string[] = ['audioData', 'transcription']) => {
  const sanitizedData = { ...data };
  excludeKeys.forEach(key => {
    if (key in sanitizedData) {
      sanitizedData[key] = '[REDACTED]';
    }
  });
  
  console.log(`[${new Date().toISOString()}] ${event}:`, sanitizedData);
};

export const logError = (error: Error, context: any = {}) => {
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: error.message,
    stack: error.stack,
    ...context
  });
};