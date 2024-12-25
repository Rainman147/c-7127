import { useState, useCallback, useRef } from 'react';
import { logger, wsLogger, LogCategory } from '@/utils/logging';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';
import type { ConnectionState } from './config';

const DEBOUNCE_DELAY = 300;
const MAX_RAPID_TRANSITIONS = 5;
const RAPID_TRANSITION_WINDOW = 10000; // 10 seconds

export const useConnectionState = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'connecting',
    lastAttempt: Date.now(),
    retryCount: 0,
    error: undefined
  });

  const { toast } = useToast();
  const stateTransitionsRef = useRef<number[]>([]);

  // Track rapid state transitions
  const checkRapidTransitions = useCallback(() => {
    const now = Date.now();
    const recentTransitions = stateTransitionsRef.current.filter(
      time => now - time < RAPID_TRANSITION_WINDOW
    );
    stateTransitionsRef.current = recentTransitions;

    if (recentTransitions.length >= MAX_RAPID_TRANSITIONS) {
      logger.warn(LogCategory.WEBSOCKET, 'ConnectionState', 'Rapid state transitions detected', {
        transitionsCount: recentTransitions.length,
        timeWindow: RAPID_TRANSITION_WINDOW
      });
      return true;
    }
    return false;
  }, []);

  // Debounced state update to prevent rapid changes
  const debouncedSetState = useCallback(
    debounce((newState: ConnectionState) => {
      wsLogger.connectionStateChange('ConnectionState', connectionState.status, newState.status, {
        retryCount: newState.retryCount,
        lastAttempt: newState.lastAttempt,
        error: newState.error?.message
      });

      setConnectionState(newState);

      // Show toast notification for state changes
      if (newState.status === 'connected' && connectionState.status !== 'connected') {
        toast({
          description: "Connection restored",
          className: "bg-green-500 text-white",
        });
      } else if (newState.status === 'disconnected' && connectionState.status !== 'disconnected') {
        toast({
          title: "Connection Lost",
          description: `Reconnecting... (Attempt ${newState.retryCount}/5)`,
          variant: "destructive",
        });
      }
    }, DEBOUNCE_DELAY),
    [connectionState.status, toast]
  );

  const updateConnectionState = useCallback((newState: Partial<ConnectionState>) => {
    const now = Date.now();
    stateTransitionsRef.current.push(now);

    if (checkRapidTransitions()) {
      logger.warn(LogCategory.WEBSOCKET, 'ConnectionState', 'Throttling state transitions', {
        currentState: connectionState,
        attemptedState: newState
      });
      return;
    }

    debouncedSetState({
      ...connectionState,
      ...newState,
      lastAttempt: now
    });
  }, [connectionState, checkRapidTransitions, debouncedSetState]);

  return {
    connectionState,
    updateConnectionState
  };
};