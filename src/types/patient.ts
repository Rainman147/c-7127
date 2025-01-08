import { Json } from '@/integrations/supabase/types';

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

export const parsePatientJson = <T>(json: Json | null): T | null => {
  if (!json) return null;
  try {
    return typeof json === 'string' ? JSON.parse(json) : json as T;
  } catch {
    return null;
  }
};