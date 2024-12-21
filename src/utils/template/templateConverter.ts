import type { Template } from '@/components/template/templateTypes';
import { Json } from '@/integrations/supabase/types';

interface DatabaseTemplate {
  id: string;
  name: string;
  content: string;
  instructions?: {
    dataFormatting: string;
    priorityRules: string;
    specialConditions: string;
  } | null;
  schema?: {
    sections: string[];
    requiredFields: string[];
  } | null;
  priority_rules?: Json | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const convertDatabaseTemplate = (dbTemplate: DatabaseTemplate): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  description: dbTemplate.content || '',
  systemInstructions: dbTemplate.content || '',
  content: dbTemplate.content || '',
  instructions: dbTemplate.instructions || {
    dataFormatting: '',
    priorityRules: '',
    specialConditions: ''
  },
  schema: dbTemplate.schema || {
    sections: [],
    requiredFields: []
  },
  priority_rules: dbTemplate.priority_rules
});