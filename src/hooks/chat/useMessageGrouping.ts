import { useMemo } from 'react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import type { MessageGroup } from '@/types/messageGrouping';

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
    logger.error(LogCategory.STATE, 'useMessageGrouping', 'Error formatting date', { 
      date: date.toISOString(),
      error 
    });
    return 'Unknown time';
  }
};

const getTimeLabel = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date string');
    }
    return formatMessageTime(date);
  } catch (error) {
    logger.error(LogCategory.STATE, 'useMessageGrouping', 'Error parsing date string', { 
      dateStr, 
      error 
    });
    return 'Unknown time';
  }
};

export const useMessageGrouping = (messages: Message[]) => {
  return useMemo(() => {
    const startTime = performance.now();
    
    if (!Array.isArray(messages)) {
      logger.error(LogCategory.STATE, 'useMessageGrouping', 'Invalid messages array', {
        messages
      });
      return [];
    }

    logger.debug(LogCategory.STATE, 'useMessageGrouping', 'Starting message grouping', { 
      messageCount: messages.length 
    });

    const groups: MessageGroup[] = [];
    let currentGroup: Message[] = [];
    let currentRole: string | null = null;

    const shouldStartNewGroup = (
      currentMessage: Message,
      previousMessage: Message | undefined
    ): boolean => {
      if (!previousMessage) return false;
      
      try {
        if (!currentMessage.created_at || !previousMessage.created_at) {
          logger.warn(LogCategory.STATE, 'useMessageGrouping', 'Missing timestamp', {
            currentMessage,
            previousMessage
          });
          return true;
        }

        const currentTime = new Date(currentMessage.created_at);
        const previousTime = new Date(previousMessage.created_at);
        
        if (isNaN(currentTime.getTime()) || isNaN(previousTime.getTime())) {
          logger.warn(LogCategory.STATE, 'useMessageGrouping', 'Invalid timestamp', {
            currentTime,
            previousTime
          });
          return true;
        }
        
        const timeDiff = differenceInMinutes(currentTime, previousTime);
        logger.debug(LogCategory.STATE, 'useMessageGrouping', 'Time difference between messages', {
          currentMessageId: currentMessage.id,
          previousMessageId: previousMessage.id,
          timeDiff,
          threshold: TIME_THRESHOLD_MINUTES
        });

        return currentMessage.role !== currentRole || timeDiff > TIME_THRESHOLD_MINUTES;
      } catch (error) {
        logger.error(LogCategory.STATE, 'useMessageGrouping', 'Error calculating time difference', {
          currentMessage,
          previousMessage,
          error
        });
        return true;
      }
    };

    const createMessageGroup = (
      groupMessages: Message[],
      firstMessage: Message
    ): MessageGroup => {
      const timestamp = firstMessage.created_at || new Date().toISOString();
      const id = `group-${firstMessage.id}`;
      
      logger.debug(LogCategory.STATE, 'useMessageGrouping', 'Creating new message group', {
        groupId: id,
        messageCount: groupMessages.length,
        firstMessageId: firstMessage.id,
        timestamp
      });

      return {
        id,
        label: getTimeLabel(timestamp),
        timestamp,
        messages: groupMessages
      };
    };

    messages.forEach((message, index) => {
      if (!message) {
        logger.warn(LogCategory.STATE, 'useMessageGrouping', 'Encountered null message', { index });
        return;
      }

      if (shouldStartNewGroup(message, messages[index - 1]) && currentGroup.length > 0) {
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
    logger.debug(LogCategory.STATE, 'useMessageGrouping', 'Message grouping complete', { 
      messageCount: messages.length,
      groupCount: groups.length,
      processingTime: `${duration.toFixed(2)}ms`
    });

    return groups;
  }, [messages]);
};