export type DatabaseMessage = {
  id: string;
  chat_id: string;
  content: string;
  sender: string;
  type: string;
  created_at: string;
  sequence: number | null;
  status: string | null;
  delivered_at: string | null;
  seen_at: string | null;
};