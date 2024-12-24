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

// Format the timestamp for display
const formatMessageTime = (date: Date): string => {
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }
  return format(date, 'MMM d, yyyy h:mm a');
};

// Get time label with error handling
const getTimeLabel = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return formatMessageTime(date);
  } catch (error) {
    logger.error(LogCategory.STATE, 'messageGrouping', 'Error formatting date:', { 
      dateStr, 
      error 
    });
    return 'Unknown time';
  }
};

// Check if a new group should be started
const shouldStartNewGroup = (
  currentMessage: Message,
  previousMessage: Message | undefined,
  currentRole: string | null
): boolean => {
  if (!previousMessage) return false;
  
  const currentTime = new Date(currentMessage.created_at || '');
  const previousTime = new Date(previousMessage.created_at || '');
  
  return currentMessage.role !== currentRole || 
         differenceInMinutes(currentTime, previousTime) > TIME_THRESHOLD_MINUTES;
};

// Create a message group object
const createMessageGroup = (
  messages: Message[],
  firstMessage: Message
): MessageGroup => {
  const timestamp = firstMessage.created_at || new Date().toISOString();
  
  return {
    id: `group-${firstMessage.id}`,
    label: getTimeLabel(timestamp),
    timestamp,
    messages
  };
};

// Main grouping function
export const groupMessages = (messages: Message[]): MessageGroup[] => {
  logger.debug(LogCategory.STATE, 'messageGrouping', 'Starting message grouping:', { 
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

  // Add the last group if there are remaining messages
  if (currentGroup.length > 0) {
    groups.push(createMessageGroup(currentGroup, currentGroup[0]));
  }

  logger.debug(LogCategory.STATE, 'messageGrouping', 'Grouping complete:', { 
    groupCount: groups.length 
  });

  return groups;
};