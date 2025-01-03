import { Json } from '@/integrations/supabase/types';
import { Template } from '@/components/template/types';

export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'audio';
  isStreaming?: boolean;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  medical_history?: string | null;
  contact_info?: Json;
  address?: string | null;
  current_medications?: Json;
  recent_tests?: Json;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Re-export Template type
export type { Template };

// Helper function to parse JSON fields from Supabase
export const parseSupabaseJson = <T>(json: Json | null): T | null => {
  if (!json) return null;
  try {
    return typeof json === 'string' ? JSON.parse(json) : json as T;
  } catch {
    return null;
  }
};