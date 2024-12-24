import { logger, LogCategory } from '@/utils/logging';

export const ScrollLogger = {
  containerInit: (container: HTMLDivElement | null, isMounted: boolean) => {
    logger.debug(LogCategory.STATE, 'ScrollManager', 'Container initialization', {
      hasContainer: !!container,
      containerDimensions: container ? {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        scrollTop: container.scrollTop,
        offsetHeight: container.offsetHeight,
        scrollRatio: container.scrollTop / container.scrollHeight
      } : null,
      isMounted,
      timestamp: new Date().toISOString()
    });
  },

  scrollAttempt: (container: HTMLDivElement, targetScroll: number, behavior: ScrollBehavior) => {
    logger.debug(LogCategory.STATE, 'ScrollManager', 'Attempting scroll', {
      currentPosition: container.scrollTop,
      targetScroll,
      behavior,
      containerDimensions: {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        offsetHeight: container.offsetHeight,
        scrollRatio: container.scrollTop / container.scrollHeight
      },
      timestamp: new Date().toISOString()
    });
  },

  scrollComplete: (container: HTMLDivElement, targetScroll: number, startTime: number) => {
    logger.debug(LogCategory.STATE, 'ScrollManager', 'Scroll operation complete', {
      finalPosition: container.scrollTop,
      targetAchieved: Math.abs(container.scrollTop - targetScroll) < 1,
      duration: performance.now() - startTime,
      containerDimensions: {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        scrollTop: container.scrollTop,
        offsetHeight: container.offsetHeight,
        scrollRatio: container.scrollTop / container.scrollHeight
      },
      timestamp: new Date().toISOString()
    });
  },

  messageUpdate: (messages: any[], isLoading: boolean, isMounted: boolean) => {
    logger.debug(LogCategory.STATE, 'ScrollManager', 'Messages updated', {
      messageCount: messages.length,
      isLoading,
      isMounted,
      timestamp: new Date().toISOString()
    });
  },

  scrollPositionChange: (currentPosition: number, maxScroll: number, isNearBottom: boolean) => {
    logger.debug(LogCategory.STATE, 'ScrollManager', 'Scroll position changed', {
      currentPosition,
      maxScroll,
      isNearBottom,
      timestamp: new Date().toISOString()
    });
  }
};