/**
 * Utility functions for managing AbortController instances
 */

export interface AbortControllerWithReason extends AbortController {
  abortReason?: string;
}

/**
 * Creates an AbortController instance with logging
 */
export const createAbortController = (operationName: string): AbortControllerWithReason => {
  console.log(`[AbortController] Created for operation: ${operationName}`);
  const controller = new AbortController() as AbortControllerWithReason;
  return controller;
};

/**
 * Aborts a controller with a specific reason
 */
export const abortWithReason = (
  controller: AbortControllerWithReason,
  reason: string
): void => {
  console.log(`[AbortController] Aborting operation: ${reason}`);
  controller.abortReason = reason;
  controller.abort(new Error(reason));
};

/**
 * Checks if a signal was aborted and logs the reason
 */
export const wasAborted = (signal: AbortSignal): boolean => {
  if (signal.aborted) {
    const reason = (signal as any).reason?.message || 'Unknown reason';
    console.log(`[AbortController] Signal was aborted: ${reason}`);
    return true;
  }
  return false;
};