import type { Database } from "./db/database.types";

/**
 * Enum Types from the database
 */
export type FeedbackStatus = Database["public"]["Enums"]["feedback_status_enum"];
export type GenerationStatus = Database["public"]["Enums"]["generation_status_enum"];
export type GoalType = Database["public"]["Enums"]["goal_enum"];
export type LevelType = Database["public"]["Enums"]["level_enum"];

/**
 * Base entity types derived from the database
 */
export type Asana = Database["public"]["Tables"]["asanas"]["Row"];
export type GeneratedSequence = Database["public"]["Tables"]["generated_sequences"]["Row"];
export type SequenceAsana = Database["public"]["Tables"]["sequence_asanas"]["Row"];
export type Feedback = Database["public"]["Tables"]["feedback"]["Row"];

/**
 * DTO Types for API responses
 */

/**
 * DTO for Asana entity
 * Used in GET /api/asanas responses
 */
export type AsanaDTO = Asana;

/**
 * Simplified Asana DTO for inclusion in sequence responses
 * Excludes unnecessary fields like is_archived and created_at
 */
export type AsanaInSequenceDTO = Pick<Asana, "id" | "sanskrit_name" | "polish_name" | "illustration_url">;

/**
 * DTO for sequence steps with associated asana information
 */
export interface SequenceAsanaDTO {
  step_number: number;
  asana: AsanaInSequenceDTO;
}

/**
 * DTO for pagination information included in list responses
 */
export interface PaginationDTO {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * DTO for GeneratedSequence in list views
 * Includes a flag indicating whether feedback exists
 */
export type GeneratedSequenceDTO = Omit<GeneratedSequence, "raw_llm_response"> & {
  has_feedback: boolean;
};

/**
 * DTO for Feedback entity
 */
export type FeedbackDTO = Feedback;

/**
 * DTO for detailed GeneratedSequence view
 * Includes associated asanas and optional feedback
 */
export type GeneratedSequenceDetailDTO = Omit<GeneratedSequence, "raw_llm_response"> & {
  asanas: SequenceAsanaDTO[];
  feedback?: {
    status: FeedbackStatus;
    user_comment: string | null;
    created_at: string;
  };
};

/**
 * Response type for paginated lists
 */
export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: PaginationDTO;
}

/**
 * Command Models for API requests
 */

/**
 * Command model for creating a new sequence
 * Used in POST /api/sequences
 */
export interface CreateSequenceCommand {
  duration_minutes: number;
  goal: GoalType;
  level: LevelType;
}

/**
 * Command model for providing feedback on a sequence
 * Used in POST /api/sequences/:id/feedback
 */
export interface CreateFeedbackCommand {
  feedback_status: FeedbackStatus;
  user_comment?: string | null;
}

/**
 * Query parameters for filtering asanas
 */
export interface AsanaQueryParams {
  page?: number;
  limit?: number;
  is_archived?: boolean;
}

/**
 * Query parameters for filtering sequences
 */
export interface SequenceQueryParams {
  page?: number;
  limit?: number;
  goal?: GoalType;
  level?: LevelType;
  status?: GenerationStatus;
}
