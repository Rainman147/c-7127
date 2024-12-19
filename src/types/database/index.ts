export * from './common';
export * from './patients';
export * from './doctors';
export * from './chats';
export * from './audio';

// Re-export all types for backward compatibility
export type { Database } from '@/integrations/supabase/types';