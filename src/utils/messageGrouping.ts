import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { logger, LogCategory } from './logging';
import type { Message } from '@/types/chat';

export interface MessageGroup {
  id: string;
  label: string;
  timestamp: string;
  messages: Message[];
}

const TIME_THRESHOLD_MINUTES = 5;

const formatMessageTime = (date: Date): string => {
  try {
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, yyyy h:mm a');
  } catch (error) {
    logger.error(LogCategory.STATE, 'messageGrouping', 'Error formatting date', { 
      date: date.toISOString(),
      error 
    });
    return 'Unknown time';
  }
};

const getTimeLabel = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return formatMessageTime(date);
  } catch (error) {
    logger.error(LogCategory.STATE, 'messageGrouping', 'Error parsing date string', { 
      dateStr, 
      error 
    });
    return 'Unknown time';
  }
};

const shouldStartNewGroup = (
  currentMessage: Message,
  previousMessage: Message | undefined,
  currentRole: string | null
): boolean => {
  if (!previousMessage) return false;
  
  try {
    const currentTime = new Date(currentMessage.created_at || '');
    const previousTime = new Date(previousMessage.created_at || '');
    
    const timeDiff = differenceInMinutes(currentTime, previousTime);
    logger.debug(LogCategory.STATE, 'messageGrouping', 'Time difference between messages', {
      currentMessageId: currentMessage.id,
      previousMessageId: previousMessage.id,
      timeDiff,
      threshold: TIME_THRESHOLD_MINUTES
    });

    return currentMessage.role !== currentRole || timeDiff > TIME_THRESHOLD_MINUTES;
  } catch (error) {
    logger.error(LogCategory.STATE, 'messageGrouping', 'Error calculating time difference', {
      currentMessage,
      previousMessage,
      error
    });
    return true;
  }
};

const createMessageGroup = (
  messages: Message[],
  firstMessage: Message
): MessageGroup => {
  const timestamp = firstMessage.created_at || new Date().toISOString();
  const id = `group-${firstMessage.id}`;
  
  logger.debug(LogCategory.STATE, 'messageGrouping', 'Creating new message group', {
    groupId: id,
    messageCount: messages.length,
    firstMessageId: firstMessage.id,
    timestamp
  });

  return {
    id,
    label: getTimeLabel(timestamp),
    timestamp,
    messages
  };
};

export const groupMessages = (messages: Message[]): MessageGroup[] => {
  const startTime = performance.now();
  logger.debug(LogCategory.STATE, 'messageGrouping', 'Starting message grouping', { 
    messageCount: messages.length 
  });

  const groups: MessageGroup[] = [];
  let currentGroup: Message[] = [];
  let currentRole: string | null = null;

  messages.forEach((message, index) => {
    if (shouldStartNewGroup(message, messages[index - 1], currentRole) && currentGroup.length > 0) {
      groups.push(createMessageGroup(currentGroup, currentGroup[0]));
      currentGroup = [];
    }

    currentGroup.push(message);
    currentRole = message.role;
  });

  if (currentGroup.length > 0) {
    groups.push(createMessageGroup(currentGroup, currentGroup[0]));
  }

  const duration = performance.now() - startTime;
  logger.debug(LogCategory.STATE, 'messageGrouping', 'Message grouping complete', { 
    messageCount: messages.length,
    groupCount: groups.length,
    processingTime: `${duration.toFixed(2)}ms`
  });

  return groups;
};