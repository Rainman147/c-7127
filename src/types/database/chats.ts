export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  template_type?: string;
}

export interface ChatInsert extends Omit<Chat, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatUpdate extends Partial<ChatInsert> {}

export interface Message {
  id: string;
  chat_id: string;
  content: string;
  sender: string;
  type: string;
  created_at: string;
}

export interface MessageInsert extends Omit<Message, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export interface MessageUpdate extends Partial<MessageInsert> {}