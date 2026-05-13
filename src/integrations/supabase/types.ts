export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          citations: Json | null
          content: string
          created_at: string
          file_id: string | null
          id: string
          role: Database["public"]["Enums"]["chat_role"]
          thread_id: string
          user_id: string
        }
        Insert: {
          citations?: Json | null
          content: string
          created_at?: string
          file_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["chat_role"]
          thread_id: string
          user_id: string
        }
        Update: {
          citations?: Json | null
          content?: string
          created_at?: string
          file_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["chat_role"]
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string
          embedding: string | null
          file_id: string
          id: string
          user_id: string
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string
          embedding?: string | null
          file_id: string
          id?: string
          user_id: string
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string
          embedding?: string | null
          file_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          name: string
          size_bytes: number | null
          storage_path: string | null
          text_content: string | null
          token_count: number | null
          type: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          name: string
          size_bytes?: number | null
          storage_path?: string | null
          text_content?: string | null
          token_count?: number | null
          type: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          name?: string
          size_bytes?: number | null
          storage_path?: string | null
          text_content?: string | null
          token_count?: number | null
          type?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          difficulty: number
          ease_factor: number
          file_id: string | null
          folder_id: string | null
          front: string
          id: string
          interval_days: number
          mastered: boolean
          next_review_at: string
          repetitions: number
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          difficulty?: number
          ease_factor?: number
          file_id?: string | null
          folder_id?: string | null
          front: string
          id?: string
          interval_days?: number
          mastered?: boolean
          next_review_at?: string
          repetitions?: number
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          difficulty?: number
          ease_factor?: number
          file_id?: string | null
          folder_id?: string | null
          front?: string
          id?: string
          interval_days?: number
          mastered?: boolean
          next_review_at?: string
          repetitions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          order: number
          parent_id: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          order?: number
          parent_id?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          order?: number
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          last_study_at: string | null
          name: string | null
          streak: number
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          last_study_at?: string | null
          name?: string | null
          streak?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_study_at?: string | null
          name?: string | null
          streak?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer: string
          explanation: string | null
          id: string
          options: Json | null
          order: number
          quiz_id: string
          stem: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          answer: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order?: number
          quiz_id: string
          stem: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          answer?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order?: number
          quiz_id?: string
          stem?: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          quiz_id: string
          score: number
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string
          id?: string
          quiz_id: string
          score?: number
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          quiz_id?: string
          score?: number
          time_taken_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          difficulty: Database["public"]["Enums"]["quiz_difficulty"]
          file_id: string | null
          folder_id: string | null
          id: string
          time_limit_seconds: number | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["quiz_difficulty"]
          file_id?: string | null
          folder_id?: string | null
          id?: string
          time_limit_seconds?: number | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["quiz_difficulty"]
          file_id?: string | null
          folder_id?: string | null
          id?: string
          time_limit_seconds?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          type: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          type: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          type?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      summaries: {
        Row: {
          content: string
          created_at: string
          file_id: string
          folder_id: string | null
          id: string
          key_points: Json | null
          type: Database["public"]["Enums"]["summary_type"]
          user_id: string
          word_count: number | null
        }
        Insert: {
          content: string
          created_at?: string
          file_id: string
          folder_id?: string | null
          id?: string
          key_points?: Json | null
          type: Database["public"]["Enums"]["summary_type"]
          user_id: string
          word_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          file_id?: string
          folder_id?: string | null
          id?: string
          key_points?: Json | null
          type?: Database["public"]["Enums"]["summary_type"]
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "summaries_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summaries_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          subject: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          subject?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          subject?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_embeddings: {
        Args: {
          filter_file_ids?: string[]
          match_count?: number
          query_embedding: string
        }
        Returns: {
          chunk_text: string
          file_id: string
          id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      chat_role: "USER" | "ASSISTANT"
      question_type: "MCQ" | "TRUE_FALSE" | "FILL"
      quiz_difficulty: "EASY" | "MEDIUM" | "HARD"
      summary_type:
        | "SHORT"
        | "DETAILED"
        | "EXAM"
        | "BULLETS"
        | "KEY_CONCEPTS"
        | "MEDIUM"
        | "LONG"
      task_priority: "HIGH" | "MEDIUM" | "LOW"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      chat_role: ["USER", "ASSISTANT"],
      question_type: ["MCQ", "TRUE_FALSE", "FILL"],
      quiz_difficulty: ["EASY", "MEDIUM", "HARD"],
      summary_type: [
        "SHORT",
        "DETAILED",
        "EXAM",
        "BULLETS",
        "KEY_CONCEPTS",
        "MEDIUM",
        "LONG",
      ],
      task_priority: ["HIGH", "MEDIUM", "LOW"],
    },
  },
} as const
