import { useState, useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';

export const useViewportMonitor = () => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [orientation, setOrientation] = useState(window.screen.orientation.type);

  useEffect(() => {
    let lastHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = lastHeight - currentHeight;
      
      // On mobile, if height decreases significantly, keyboard is likely visible
      const isKeyboardVisible = heightDiff > 150;
      
      logger.debug(LogCategory.STATE, 'ViewportMonitor', 'Viewport changed', {
        previousHeight: lastHeight,
        currentHeight,
        heightDifference: heightDiff,
        keyboardVisible: isKeyboardVisible,
        orientation: window.screen.orientation.type,
        timestamp: new Date().toISOString()
      });
      
      setViewportHeight(currentHeight);
      setKeyboardVisible(isKeyboardVisible);
      lastHeight = currentHeight;
    };

    const handleOrientationChange = () => {
      const newOrientation = window.screen.orientation.type;
      
      logger.debug(LogCategory.STATE, 'ViewportMonitor', 'Orientation changed', {
        previousOrientation: orientation,
        newOrientation,
        viewportHeight: window.innerHeight,
        timestamp: new Date().toISOString()
      });
      
      setOrientation(newOrientation);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Log initial state
    logger.debug(LogCategory.STATE, 'ViewportMonitor', 'Initial viewport state', {
      height: window.innerHeight,
      width: window.innerWidth,
      orientation: window.screen.orientation.type,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [orientation]);

  return {
    viewportHeight,
    keyboardVisible,
    orientation
  };
};