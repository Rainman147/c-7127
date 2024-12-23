import { format, isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import type { Message } from '@/types/chat';
import { logger, LogCategory } from '@/utils/logging';

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
  let currentRole: string | null = null;

  const getTimeLabel = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      
      if (!date || isNaN(date.getTime())) {
        logger.error(LogCategory.STATE, 'messageGrouping', 'Invalid date:', { dateStr });
        return 'Unknown Date';
      }

      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      if (isThisWeek(date)) return format(date, 'EEEE');
      if (isThisMonth(date)) return format(date, 'MMMM d');
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      logger.error(LogCategory.STATE, 'messageGrouping', 'Error formatting date:', { 
        dateStr, 
        error 
      });
      return 'Unknown Date';
    }
  };

  messages.forEach((message, index) => {
    // Use role instead of sender for grouping
    const shouldStartNewGroup = 
      message.role !== currentRole || 
      (index > 0 && new Date(message.created_at || '').getTime() - 
       new Date(messages[index - 1].created_at || '').getTime() > 5 * 60 * 1000);

    if (shouldStartNewGroup && currentGroup.length > 0) {
      const firstMessage = currentGroup[0];
      const timeLabel = getTimeLabel(firstMessage.created_at || '');
      
      try {
        const timestamp = firstMessage.created_at ? 
          format(parseISO(firstMessage.created_at), 'h:mm a') : 
          'Unknown time';

        groups.push({
          id: `group-${groups.length}`,
          messages: [...currentGroup],
          timestamp,
          label: timeLabel
        });
      } catch (error) {
        logger.error(LogCategory.STATE, 'messageGrouping', 'Error creating group:', { 
          error,
          firstMessage 
        });
      }
      
      currentGroup = [];
    }

    currentGroup.push(message);
    currentRole = message.role;
  });

  // Add the last group
  if (currentGroup.length > 0) {
    const firstMessage = currentGroup[0];
    const timeLabel = getTimeLabel(firstMessage.created_at || '');
    
    try {
      const timestamp = firstMessage.created_at ? 
        format(parseISO(firstMessage.created_at), 'h:mm a') : 
        'Unknown time';

      groups.push({
        id: `group-${groups.length}`,
        messages: [...currentGroup],
        timestamp,
        label: timeLabel
      });
    } catch (error) {
      logger.error(LogCategory.STATE, 'messageGrouping', 'Error creating final group:', { 
        error,
        firstMessage 
      });
    }
  }

  return groups;
};