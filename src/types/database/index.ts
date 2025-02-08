
import { Database } from '@/integrations/supabase/types';

// Database row types
export type DbChat = Database['public']['Tables']['chats']['Row'];
export type DbMessage = Database['public']['Tables']['messages']['Row'];
export type DbPatient = Database['public']['Tables']['patients']['Row'];
export type DbTemplate = Database['public']['Tables']['templates']['Row'];
export type DbDoctor = Database['public']['Tables']['doctors']['Row'];
export type DbEhrExport = Database['public']['Tables']['ehr_exports']['Row'];

// Database enum types
export type MessageRole = Database['public']['Enums']['message_role'];
export type MessageType = Database['public']['Enums']['message_type'];
export type RateLimitType = Database['public']['Enums']['rate_limit_type'];
