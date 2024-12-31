export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'audio';
  isStreaming?: boolean;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  instructions?: Record<string, any>;
  schema?: Record<string, any>;
  priority_rules?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  medical_history?: string | null;
  contact_info?: {
    phone?: string;
    email?: string;
  } | null;
  address?: string | null;
  current_medications?: string[] | null;
  recent_tests?: Array<{
    name: string;
    date: string;
    result: string;
  }> | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}