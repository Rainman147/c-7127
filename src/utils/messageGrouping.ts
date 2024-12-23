import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import type { Message } from '@/types/chat';

type MessageGroup = {
  id: string;
  messages: Message[];
  timestamp: string;
  label: string;
};

export const groupMessages = (messages: Message[]): MessageGroup[] => {
  if (!messages.length) return [];

  const groups: MessageGroup[] = [];
  let currentGroup: Message[] = [];
  let currentSender: string | null = null;

  const getTimeLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isThisWeek(date)) return format(date, 'EEEE');
    if (isThisMonth(date)) return format(date, 'MMMM d');
    return format(date, 'MMMM d, yyyy');
  };

  messages.forEach((message, index) => {
    const messageDate = new Date(message.created_at || '');
    const timeLabel = getTimeLabel(messageDate);
    
    // Start a new group if sender changes or more than 5 minutes between messages
    const shouldStartNewGroup = 
      message.sender !== currentSender || 
      (index > 0 && new Date(message.created_at || '').getTime() - 
       new Date(messages[index - 1].created_at || '').getTime() > 5 * 60 * 1000);

    if (shouldStartNewGroup && currentGroup.length > 0) {
      const groupDate = new Date(currentGroup[0].created_at || '');
      groups.push({
        id: `group-${groups.length}`,
        messages: [...currentGroup],
        timestamp: format(groupDate, 'h:mm a'),
        label: timeLabel
      });
      currentGroup = [];
    }

    currentGroup.push(message);
    currentSender = message.sender;
  });

  // Add the last group
  if (currentGroup.length > 0) {
    const groupDate = new Date(currentGroup[0].created_at || '');
    groups.push({
      id: `group-${groups.length}`,
      messages: [...currentGroup],
      timestamp: format(groupDate, 'h:mm a'),
      label: getTimeLabel(groupDate)
    });
  }

  return groups;
};