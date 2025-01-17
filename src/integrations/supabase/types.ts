export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audio_chunks: {
        Row: {
          chunk_number: number
          created_at: string
          id: string
          original_filename: string
          session_id: string | null
          status: string | null
          storage_path: string
          total_chunks: number
          transcription: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chunk_number: number
          created_at?: string
          id?: string
          original_filename: string
          session_id?: string | null
          status?: string | null
          storage_path: string
          total_chunks: number
          transcription?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chunk_number?: number
          created_at?: string
          id?: string
          original_filename?: string
          session_id?: string | null
          status?: string | null
          storage_path?: string
          total_chunks?: number
          transcription?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_chunks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          patient_id: string | null
          template_type: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id?: string | null
          template_type?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string | null
          template_type?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          address: string
          business_hours: Json
          clinic_name: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          license_number: string
          phone: string
          profile_photo_url: string | null
          specialty: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          business_hours?: Json
          clinic_name: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          license_number: string
          phone: string
          profile_photo_url?: string | null
          specialty: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          business_hours?: Json
          clinic_name?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          license_number?: string
          phone?: string
          profile_photo_url?: string | null
          specialty?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      edited_messages: {
        Row: {
          created_at: string
          edited_content: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          edited_content: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          edited_content?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edited_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edited_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ehr_exports: {
        Row: {
          chat_id: string | null
          created_at: string
          ehr_system: string
          error_message: string | null
          export_data: Json
          id: string
          patient_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          ehr_system: string
          error_message?: string | null
          export_data: Json
          id?: string
          patient_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          ehr_system?: string
          error_message?: string | null
          export_data?: Json
          id?: string
          patient_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ehr_exports_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehr_exports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ehr_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comments: string | null
          created_at: string
          feedback_type: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          feedback_type: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      file_upload_sessions: {
        Row: {
          chunks_uploaded: number | null
          content_type: string
          created_at: string
          id: string
          original_filename: string
          status: string | null
          total_chunks: number
          total_size: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chunks_uploaded?: number | null
          content_type: string
          created_at?: string
          id?: string
          original_filename: string
          status?: string | null
          total_chunks: number
          total_size: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chunks_uploaded?: number | null
          content_type?: string
          created_at?: string
          id?: string
          original_filename?: string
          status?: string | null
          total_chunks?: number
          total_size?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_upload_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          delivered_at: string | null
          id: string
          seen_at: string | null
          sender: string
          sequence: number | null
          status: string | null
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          seen_at?: string | null
          sender: string
          sequence?: number | null
          status?: string | null
          type?: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          seen_at?: string | null
          sender?: string
          sequence?: number | null
          status?: string | null
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          contact_info: Json | null
          created_at: string
          current_medications: Json | null
          dob: string
          id: string
          last_accessed: string | null
          medical_history: string | null
          name: string
          recent_tests: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_info?: Json | null
          created_at?: string
          current_medications?: Json | null
          dob: string
          id?: string
          last_accessed?: string | null
          medical_history?: string | null
          name: string
          recent_tests?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          contact_info?: Json | null
          created_at?: string
          current_medications?: Json | null
          dob?: string
          id?: string
          last_accessed?: string | null
          medical_history?: string | null
          name?: string
          recent_tests?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      template_contexts: {
        Row: {
          chat_id: string | null
          created_at: string
          id: string
          message_id: string | null
          metadata: Json | null
          system_instructions: string
          template_id: string
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          system_instructions: string
          template_id: string
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          system_instructions?: string
          template_id?: string
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "template_contexts_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_contexts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_contexts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          content: string
          created_at: string
          description: string
          id: string
          instructions: Json | null
          name: string
          priority_rules: Json | null
          schema: Json | null
          system_instructions: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          description?: string
          id?: string
          instructions?: Json | null
          name: string
          priority_rules?: Json | null
          schema?: Json | null
          system_instructions?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string
          id?: string
          instructions?: Json | null
          name?: string
          priority_rules?: Json | null
          schema?: Json | null
          system_instructions?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_upload_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      message_type: "text" | "audio"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
