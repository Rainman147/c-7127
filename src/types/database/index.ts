
import { Database } from '@/integrations/supabase/types';

// Database table row types
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

// Strongly typed JSON field types
export type ContactInfo = {
  email?: string;
  phone?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
};

export type CurrentMedications = {
  name: string;
  dosage: string;
  frequency: string;
  start_date?: string;
}[];

export type RecentTests = {
  name: string;
  date: string;
  results: string;
  notes?: string;
}[];

export type BusinessHours = {
  [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: {
    open: string;
    close: string;
  } | null;
};

export type ExportData = {
  template_id: string;
  chat_id: string;
  content: string;
  metadata?: Record<string, unknown>;
};
