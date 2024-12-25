import { useMemo, useCallback } from 'react';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { logger, LogCategory } from '@/utils/logging';
import type { Message } from '@/types/chat';
import type { MessageGroup } from '@/types/messageGrouping';

const TIME_THRESHOLD_MINUTES = 5;

// Memoized date formatter
const useMessageTimeFormatter = () => {
  return useCallback((date: Date): string => {
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
  }, []);
};

export const useMessageGrouping = (messages: Message[]) => {
  const formatMessageTime = useMessageTimeFormatter();

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

    // Memoized group check function
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
        
        return currentMessage.role !== currentRole || timeDiff > TIME_THRESHOLD_MINUTES;
      } catch (error) {
        logger.error(LogCategory.STATE, 'useMessageGrouping', 'Error calculating time difference', {
          error
        });
        return true;
      }
    };

    // Process messages in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      batch.forEach((message, index) => {
        if (!message) {
          logger.warn(LogCategory.STATE, 'useMessageGrouping', 'Encountered null message', { index: i + index });
          return;
        }

        if (shouldStartNewGroup(message, messages[i + index - 1]) && currentGroup.length > 0) {
          const timestamp = currentGroup[0].created_at || new Date().toISOString();
          const id = `group-${currentGroup[0].id}`;
          
          groups.push({
            id,
            label: formatMessageTime(new Date(timestamp)),
            timestamp,
            messages: [...currentGroup]
          });
          
          currentGroup = [];
        }

        currentGroup.push(message);
        currentRole = message.role;
      });
    }

    if (currentGroup.length > 0) {
      const timestamp = currentGroup[0].created_at || new Date().toISOString();
      const id = `group-${currentGroup[0].id}`;
      
      groups.push({
        id,
        label: formatMessageTime(new Date(timestamp)),
        timestamp,
        messages: [...currentGroup]
      });
    }

    const duration = performance.now() - startTime;
    logger.debug(LogCategory.STATE, 'useMessageGrouping', 'Message grouping complete', { 
      messageCount: messages.length,
      groupCount: groups.length,
      processingTime: `${duration.toFixed(2)}ms`,
      batchCount: Math.ceil(messages.length / batchSize)
    });

    return groups;
  }, [messages, formatMessageTime]);
};