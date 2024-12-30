import { format } from 'date-fns';
import type { Message, MessageGroup } from '@/types/chat';

export const groupMessages = (messages: Message[]): MessageGroup[] => {
  if (!messages || messages.length === 0) return [];

  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  messages.forEach((message) => {
    const messageDate = message.created_at ? new Date(message.created_at) : new Date();
    const dateStr = format(messageDate, 'MMMM d, yyyy');
    
    if (!currentGroup || currentGroup.label !== dateStr) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        id: `group-${dateStr}`,
        label: dateStr,
        timestamp: messageDate.toISOString(),
        messages: []
      };
    }
    
    if (currentGroup) {
      currentGroup.messages.push(message);
    }
  });

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
};