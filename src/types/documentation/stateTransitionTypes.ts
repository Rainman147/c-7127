export type StateTransition<T> = {
  from: T;
  to: T;
  timestamp: string;
  metadata?: Record<string, unknown>;
};