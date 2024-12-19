export interface AudioChunk {
  id: string;
  user_id: string;
  original_filename: string;
  chunk_number: number;
  total_chunks: number;
  storage_path: string;
  transcription?: string;
  status?: string;
  created_at: string;
  updated_at: string;
  session_id?: string;
}

export interface AudioChunkInsert extends Omit<AudioChunk, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AudioChunkUpdate extends Partial<AudioChunkInsert> {}