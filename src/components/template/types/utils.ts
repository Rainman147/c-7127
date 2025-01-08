import { Json } from '@/integrations/supabase/types';

// Helper function to safely parse JSON fields
export const parseJsonField = (json: Json | null): Record<string, any> | null => {
  if (!json) return null;
  if (typeof json === 'string') {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
  return json as Record<string, any>;
};