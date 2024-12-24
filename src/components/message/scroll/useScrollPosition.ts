import { useEffect, useRef } from 'react';
import { ScrollLogger } from './ScrollLogger';

export const useScrollPosition = (
  containerRef: React.RefObject<HTMLDivElement>,
  isMounted: boolean,
  onScroll: (currentPosition: number, maxScroll: number) => void
) => {
  const lastScrollPosition = useRef<number>(0);
  const lastScrollTime = useRef<number>(Date.now());

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMounted) {
      ScrollLogger.containerInit(container, isMounted);
      return;
    }

    const handleScroll = () => {
      const currentPosition = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      const isNearBottom = maxScroll - currentPosition < 100;
      const scrollTime = Date.now();
      
      ScrollLogger.scrollPositionChange(currentPosition, maxScroll, isNearBottom);
      
      lastScrollPosition.current = currentPosition;
      lastScrollTime.current = scrollTime;
      onScroll(currentPosition, maxScroll);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, isMounted, onScroll]);

  return {
    lastScrollPosition,
    lastScrollTime
  };
};