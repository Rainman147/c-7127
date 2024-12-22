export type DatabaseMessage = {
  id: string;
  chat_id: string;
  content: string;
  sender: string;
  type: string;
  created_at: string;
  sequence?: number;
  timestamp?: string;
};