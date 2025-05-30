import type { SupabaseClient } from "@/db/supabase.client.ts";
import type { AsanaQueryParams, PaginatedResponseDTO, AsanaDTO } from "@/types.ts";
import logger from "@/lib/logger";

/**
 * Service class for handling business logic related to Asanas.
 */
export class AsanaService {
  private supabase: SupabaseClient;

  /**
   * Creates an instance of AsanaService.
   * @param {SupabaseClient} supabase - The Supabase client instance.
   */
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Fetches a paginated list of asanas based on query parameters.
   *
   * @param {AsanaQueryParams} params - The query parameters for filtering and pagination.
   * @param {number} [params.page=1] - The page number to retrieve.
   * @param {number} [params.limit=20] - The number of items per page.
   * @param {boolean} [params.is_archived] - Optional filter for archived status.
   * @returns {Promise<PaginatedResponseDTO<AsanaDTO>>} A promise that resolves to the paginated list of asanas.
   * @throws {Error} If fetching from the database fails.
   */
  async getAsanas(params: AsanaQueryParams): Promise<PaginatedResponseDTO<AsanaDTO>> {
    // Step 5: Implement AsanaService logic
    const { page = 1, limit = 20, is_archived } = params;

    // 1. Calculate offset for pagination
    const offset = (page - 1) * limit;

    // 2. Create base Supabase query
    let query = this.supabase
      .from("asanas")
      .select("id, sanskrit_name, polish_name, illustration_url, is_archived, created_at", { count: "exact" }); // Select only necessary columns and get the count

    // 3. Add is_archived filter if provided
    if (is_archived !== undefined) {
      query = query.eq("is_archived", is_archived);
    }

    // 4. Apply pagination and sorting
    query = query.range(offset, offset + limit - 1).order("created_at", { ascending: false }); // Default sort by creation date descending

    // 5. Execute the query
    const { data, error, count } = await query;

    // 6. Handle query errors
    if (error) {
      logger.error({ err: error }, "Supabase error fetching asanas in AsanaService");
      // Throw the error to be caught by the endpoint handler
      throw new Error("Failed to fetch asanas from database.");
    }

    // 7. Calculate pagination metadata
    const total = count || 0;
    const pages = Math.ceil(total / limit);

    // 8. Return the response in the required format
    return {
      data: (data as AsanaDTO[]) || [], // Cast to AsanaDTO[] or empty array
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  }

  /**
   * Fetches a single asana by its ID from the database.
   *
   * @param {string} id - The UUID of the asana to retrieve.
   * @returns {Promise<AsanaDTO | null>} A promise that resolves to the AsanaDTO object if found,
   *                                      or null if no asana with the given ID exists.
   * @throws {Error} If a database error occurs during the fetch operation (excluding the 'not found' case).
   */
  async getAsanaById(id: string): Promise<AsanaDTO | null> {
    logger.info({ asanaId: id }, "Attempting to fetch asana by ID in AsanaService.");
    const { data, error } = await this.supabase
      .from("asanas")
      .select("*") // Select all columns for a single asana view
      .eq("id", id)
      .single();

    // Handle query errors
    if (error) {
      // If the error is "Row not found", it's not a server error, return null
      if (error.code === "PGRST116") {
        logger.warn({ asanaId: id }, "Asana not found in database (AsanaService).");
        return null;
      }
      // For other errors, log and throw
      logger.error({ err: error, asanaId: id }, "Supabase error fetching asana by ID in AsanaService");
      throw new Error(`Failed to fetch asana with ID ${id} from database.`);
    }

    // If data is null/undefined (shouldn't happen with .single() if no error, but check anyway)
    if (!data) {
      logger.warn({ asanaId: id }, "Asana not found (no data returned) in database (AsanaService).");
      return null;
    }

    logger.info({ asanaId: id }, "Successfully fetched asana by ID in AsanaService.");
    return data as AsanaDTO; // Cast to AsanaDTO
  }
}
