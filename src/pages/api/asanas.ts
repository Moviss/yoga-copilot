import { z } from "zod";
import type { APIContext } from "astro";
import { AsanaService } from "@/lib/services/asana.service.ts"; // Import AsanaService
import type { SupabaseClient } from "@/db/supabase.client.ts"; // Import SupabaseClient type
import logger from "@/lib/logger"; // Import the logger

export const prerender = false;

// Step 3: Implement Zod validation schema for query parameters
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  // Explicitly handle 'true'/'false' strings and transform to boolean
  is_archived: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

/**
 * GET handler for the /api/asanas endpoint.
 * Retrieves a paginated and optionally filtered list of asanas.
 *
 * Query Parameters (validated via Zod):
 * - `page` (number, optional, default: 1): The page number for pagination.
 * - `limit` (number, optional, default: 20, max: 100): The number of items per page.
 * - `is_archived` (boolean, optional): Filter by archived status (expects "true" or "false" strings).
 *
 * @param {APIContext} context - The Astro API context, containing request, locals (supabase), etc.
 * @returns {Promise<Response>} A Response object containing:
 *   - 200 OK: With JSON body `PaginatedResponseDTO<AsanaDTO>` on success.
 *   - 400 Bad Request: If query parameters are invalid.
 *   - 401 Unauthorized: If the user is not authenticated (in production).
 *   - 500 Internal Server Error: If there's a server-side error.
 * @throws {Error} If fetching from the database fails.
 */
export async function GET({ request, locals }: APIContext) {
  // Check authorization (conditionally disabled in development)
  const supabase = locals.supabase; // Get Supabase client instance
  const url = new URL(request.url);

  // Only perform authentication check in production environment
  if (import.meta.env.PROD) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      logger.warn({ path: url.pathname }, "Unauthorized access attempt without session.");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    // Log a warning if auth check is skipped in development
    logger.warn({ path: url.pathname }, "Authentication check skipped in development environment.");
  }

  try {
    // Get and validate query parameters
    const queryResult = querySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!queryResult.success) {
      // Log validation error for debugging purposes
      logger.error({ err: queryResult.error.format(), path: url.pathname }, "Invalid query parameters");
      return new Response(JSON.stringify({ error: "Invalid query parameters", details: queryResult.error.format() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const query = queryResult.data;

    // Create service instance and fetch data
    const asanaService = new AsanaService(supabase as SupabaseClient); // Type assertion needed if locals.supabase is not strictly typed
    const response = await asanaService.getAsanas(query);

    // Return the response
    return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    // Log server error
    logger.error({ err: error, path: url.pathname }, "Error fetching asanas");
    // Return generic server error
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
