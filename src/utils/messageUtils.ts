import { type Message } from '@/types/chat';

// Consider a message historical if it's older than 5 seconds
const HISTORICAL_THRESHOLD_MS = 5000;

export const isMessageHistorical = (message: Message): boolean => {
  if (!message.created_at) return false;
  
  const messageDate = new Date(message.created_at);
  const now = new Date();
  
  // If message is older than threshold, consider it historical
  return now.getTime() - messageDate.getTime() > HISTORICAL_THRESHOLD_MS;
};