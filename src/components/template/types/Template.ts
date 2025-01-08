export type Template = {
  id: string;
  name: string;
  description: string;
  systemInstructions: string;
  // Database fields (optional since hardcoded templates won't have these)
  content?: string;
  instructions?: Record<string, any> | null;
  schema?: Record<string, any> | null;
  priority_rules?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};