import type { Message } from '@/types/chat';

const HISTORICAL_THRESHOLD_MS = 5000; // 5 seconds

export const isMessageHistorical = (message: Pick<Message, 'id' | 'created_at'>) => {
  if (!message.created_at) {
    return false;
  }

  const createdAt = new Date(message.created_at).getTime();
  const now = Date.now();
  
  return (now - createdAt) > HISTORICAL_THRESHOLD_MS;
};