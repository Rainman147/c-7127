
import { Database } from '@/integrations/supabase/types';

export type DbRecord = {
  id: string;
  created_at: string;
  updated_at: string;
};

// Database table row types
export type DbChat = Database['public']['Tables']['chats']['Row'];
export type DbMessage = Database['public']['Tables']['messages']['Row'];
export type DbPatient = Database['public']['Tables']['patients']['Row'];
export type DbTemplate = Database['public']['Tables']['templates']['Row'];
export type DbDoctor = Database['public']['Tables']['doctors']['Row'];
export type DbEhrExport = Database['public']['Tables']['ehr_exports']['Row'];
export type DbAudioChunk = Database['public']['Tables']['audio_chunks']['Row'];

// Insert types
export type DbChatInsert = Database['public']['Tables']['chats']['Insert'];
export type DbMessageInsert = Database['public']['Tables']['messages']['Insert'];
export type DbPatientInsert = Database['public']['Tables']['patients']['Insert'];
export type DbTemplateInsert = Database['public']['Tables']['templates']['Insert'];
export type DbDoctorInsert = Database['public']['Tables']['doctors']['Insert'];
export type DbEhrExportInsert = Database['public']['Tables']['ehr_exports']['Insert'];
export type DbAudioChunkInsert = Database['public']['Tables']['audio_chunks']['Insert'];

// Update types
export type DbChatUpdate = Database['public']['Tables']['chats']['Update'];
export type DbMessageUpdate = Database['public']['Tables']['messages']['Update'];
export type DbPatientUpdate = Database['public']['Tables']['patients']['Update'];
export type DbTemplateUpdate = Database['public']['Tables']['templates']['Update'];
export type DbDoctorUpdate = Database['public']['Tables']['doctors']['Update'];
export type DbEhrExportUpdate = Database['public']['Tables']['ehr_exports']['Update'];
export type DbAudioChunkUpdate = Database['public']['Tables']['audio_chunks']['Update'];

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

