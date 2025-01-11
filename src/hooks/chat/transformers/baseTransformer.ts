import { MessageRole, MessageStatus, MessageType } from '@/types/message';
import { parseSupabaseJson } from '@/types/utils';

// Validate and convert database sender to frontend role
export const validateMessageRole = (sender: string): MessageRole => {
  console.log('[validateMessageRole] Validating sender:', sender);
  if (sender !== 'user' && sender !== 'assistant') {
    console.warn(`[validateMessageRole] Invalid sender type: ${sender}, defaulting to 'user'`);
    return 'user';
  }
  return sender as MessageRole;
};

// Validate and convert database status to frontend status
export const validateMessageStatus = (status: string | null): MessageStatus => {
  console.log('[validateMessageStatus] Validating status:', status);
  const validStatuses: MessageStatus[] = ['queued', 'sending', 'sent', 'error'];
  if (!status || !validStatuses.includes(status as MessageStatus)) {
    console.warn(`[validateMessageStatus] Invalid status: ${status}, defaulting to 'queued'`);
    return 'queued';
  }
  return status as MessageStatus;
};

// Validate message type
export const validateMessageType = (type: string | null): MessageType => {
  console.log('[validateMessageType] Validating type:', type);
  if (type !== 'text' && type !== 'audio') {
    console.warn(`[validateMessageType] Invalid type: ${type}, defaulting to 'text'`);
    return 'text';
  }
  return type as MessageType;
};