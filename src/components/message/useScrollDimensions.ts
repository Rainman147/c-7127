import { useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';

export const useScrollDimensions = (
  containerRef: React.RefObject<HTMLDivElement>,
  isMounted: boolean,
  onScroll: (currentPosition: number, maxScroll: number) => void
) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMounted) {
      logger.debug(LogCategory.STATE, 'ScrollDimensions', 'Container not ready for scroll tracking', {
        isMounted,
        hasContainer: !!container,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const handleScroll = () => {
      const currentPosition = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      onScroll(currentPosition, maxScroll);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, isMounted, onScroll]);
};