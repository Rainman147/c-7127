import { useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import { ErrorTracker } from '@/utils/errorTracking';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types/chat';

interface PerformanceMonitorProps {
  messages: Message[];
  messageGroups: any[];
  performanceMetrics: {
    renderedNodes: number;
  };
  renderStartTime: React.MutableRefObject<number>;
}

const PERFORMANCE_WARNING_THRESHOLD = 100; // ms

export const PerformanceMonitor = ({
  messages,
  messageGroups,
  performanceMetrics,
  renderStartTime
}: PerformanceMonitorProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    if (renderTime > PERFORMANCE_WARNING_THRESHOLD) {
      const metadata = {
        component: 'MessageList',
        severity: 'medium',
        errorType: 'performance',
        operation: 'initial-render',
        timestamp: new Date().toISOString(),
        additionalInfo: {
          renderTime,
          messageCount: messages?.length,
          groupCount: messageGroups?.length,
          renderedNodes: performanceMetrics.renderedNodes
        }
      };
      
      ErrorTracker.trackError(
        new Error(`Slow initial render detected: ${renderTime.toFixed(2)}ms`),
        metadata
      );
      
      toast({
        title: 'Performance Warning',
        description: 'Message list rendering is slower than expected. Consider reducing message count.',
        variant: 'destructive'
      });
    }
  }, [messages?.length, messageGroups?.length, performanceMetrics.renderedNodes, toast]);

  return null;
};