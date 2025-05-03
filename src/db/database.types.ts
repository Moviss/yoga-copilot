export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      asanas: {
        Row: {
          created_at: string;
          id: string;
          illustration_url: string;
          is_archived: boolean;
          polish_name: string;
          sanskrit_name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          illustration_url: string;
          is_archived?: boolean;
          polish_name: string;
          sanskrit_name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          illustration_url?: string;
          is_archived?: boolean;
          polish_name?: string;
          sanskrit_name?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          created_at: string;
          feedback_status: Database["public"]["Enums"]["feedback_status_enum"];
          generated_sequence_id: string;
          id: string;
          user_comment: string | null;
        };
        Insert: {
          created_at?: string;
          feedback_status: Database["public"]["Enums"]["feedback_status_enum"];
          generated_sequence_id: string;
          id?: string;
          user_comment?: string | null;
        };
        Update: {
          created_at?: string;
          feedback_status?: Database["public"]["Enums"]["feedback_status_enum"];
          generated_sequence_id?: string;
          id?: string;
          user_comment?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_generated_sequence_id_fkey";
            columns: ["generated_sequence_id"];
            isOneToOne: true;
            referencedRelation: "generated_sequences";
            referencedColumns: ["id"];
          },
        ];
      };
      generated_sequences: {
        Row: {
          created_at: string;
          duration_minutes: number;
          generation_status: Database["public"]["Enums"]["generation_status_enum"];
          goal: Database["public"]["Enums"]["goal_enum"];
          id: string;
          level: Database["public"]["Enums"]["level_enum"];
          raw_llm_response: Json | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          duration_minutes: number;
          generation_status?: Database["public"]["Enums"]["generation_status_enum"];
          goal: Database["public"]["Enums"]["goal_enum"];
          id?: string;
          level: Database["public"]["Enums"]["level_enum"];
          raw_llm_response?: Json | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          duration_minutes?: number;
          generation_status?: Database["public"]["Enums"]["generation_status_enum"];
          goal?: Database["public"]["Enums"]["goal_enum"];
          id?: string;
          level?: Database["public"]["Enums"]["level_enum"];
          raw_llm_response?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      sequence_asanas: {
        Row: {
          asana_id: string;
          created_at: string;
          generated_sequence_id: string;
          id: string;
          step_number: number;
        };
        Insert: {
          asana_id: string;
          created_at?: string;
          generated_sequence_id: string;
          id?: string;
          step_number: number;
        };
        Update: {
          asana_id?: string;
          created_at?: string;
          generated_sequence_id?: string;
          id?: string;
          step_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sequence_asanas_asana_id_fkey";
            columns: ["asana_id"];
            isOneToOne: false;
            referencedRelation: "asanas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sequence_asanas_generated_sequence_id_fkey";
            columns: ["generated_sequence_id"];
            isOneToOne: false;
            referencedRelation: "generated_sequences";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      feedback_status_enum: "accepted" | "rejected";
      generation_status_enum: "success" | "failure";
      goal_enum: "balance" | "strength" | "flexibility" | "relaxation" | "energy" | "mindfulness";
      level_enum: "beginner" | "intermediate" | "advanced";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      feedback_status_enum: ["accepted", "rejected"],
      generation_status_enum: ["success", "failure"],
      goal_enum: ["balance", "strength", "flexibility", "relaxation", "energy", "mindfulness"],
      level_enum: ["beginner", "intermediate", "advanced"],
    },
  },
} as const;
