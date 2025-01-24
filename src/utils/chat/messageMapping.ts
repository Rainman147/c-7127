import type { Message, MessageStatus } from '@/types/chat';

const isValidStatus = (status: string): status is MessageStatus => {
  return ['delivered', 'processing', 'failed'].includes(status);
};

export const mapDatabaseMessage = (msg: any): Message => ({
  id: msg.id,
  role: msg.role,
  content: msg.content,
  type: msg.type || 'text',
  status: isValidStatus(msg.status) ? msg.status : 'delivered',
  created_at: msg.created_at
});