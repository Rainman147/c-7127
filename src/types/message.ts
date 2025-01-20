export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'audio';
  isStreaming?: boolean;
  wasEdited?: boolean;
}

// Helper function to convert database message to frontend format
export const mapDatabaseMessageToMessage = (dbMessage: any): Message => {
  return {
    id: dbMessage.id,
    role: dbMessage.sender === 'user' ? 'user' : 'assistant',
    content: dbMessage.content,
    type: dbMessage.type || 'text',
    wasEdited: false // We'll handle this separately when we implement message editing
  };
};