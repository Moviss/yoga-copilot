import type { APIContext } from "astro";
import { z } from "zod";
import type { SupabaseClient } from "src/db/supabase.client";
import type { AsanaDTO } from "src/types";
import logger from "@/lib/logger";
import { AsanaService } from "@/lib/services/asana.service.ts";

// Disable prerendering for this dynamic API endpoint
export const prerender = false;

// Step 3: Zod schema definition for ID validation (must be a UUID)
const idSchema = z.string().uuid({ message: "Asana ID must be a valid UUID string." });

/**
 * Handles GET requests for the `/api/asanas/[id]` endpoint.
 *
 * Retrieves a specific asana by its UUID, provided as a dynamic path parameter.
 * It validates the ID format, uses `AsanaService` to fetch the data from the database,
 * and handles various response scenarios (success, not found, invalid ID, server errors).
 *
 * @param {APIContext} context - The Astro API context.
 * @param {object} context.params - Contains route parameters. Expects `id` to be the Asana UUID.
 * @param {object} context.locals - Contains locals, including the Supabase client instance (`supabase`).
 * @param {Request} context.request - The incoming request object, used here to extract the URL path for logging.
 *
 * @returns {Promise<Response>} A Response object containing:
 *   - 200 OK: With the `AsanaDTO` object in the JSON body if the asana is found.
 *   - 400 Bad Request: If the provided `id` parameter is not a valid UUID.
 *   - 404 Not Found: If an asana with the specified `id` does not exist in the database.
 *   - 500 Internal Server Error: If the Supabase client is missing or if any unexpected server-side error occurs during processing (including database errors other than 'not found').
 */
export async function GET({ params, locals, request }: APIContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Step 3: Get the `id` parameter from `params` and validate it
  const idValidationResult = idSchema.safeParse(params.id);

  if (!idValidationResult.success) {
    logger.warn({ path, error: idValidationResult.error.flatten() }, "Invalid Asana ID format received.");
    return new Response(
      JSON.stringify({
        error: "Invalid Asana ID format.",
        details: idValidationResult.error.flatten().formErrors[0],
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const asanaId = idValidationResult.data;
  logger.info({ path, asanaId }, "Validated Asana ID. Proceeding to fetch data via service.");

  // Step 4: Get Supabase client from locals
  const supabase: SupabaseClient = locals.supabase;

  if (!supabase) {
    logger.error({ path, asanaId }, "Supabase client not found in locals.");
    return new Response(JSON.stringify({ error: "Internal Server Error: Supabase client is unavailable." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Instantiate the service
    const asanaService = new AsanaService(supabase);

    // Step 5 & 6 (combined): Fetch the asana using the service
    logger.info({ path, asanaId }, "Calling AsanaService.getAsanaById.");
    const asana: AsanaDTO | null = await asanaService.getAsanaById(asanaId);

    // Handle not found (service returns null)
    if (!asana) {
      logger.warn({ path, asanaId }, "Asana not found (service returned null).");
      return new Response(JSON.stringify({ error: `Asana with ID ${asanaId} not found.` }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 8: Return successful response with the fetched asana data
    logger.info({ path, asanaId }, "Successfully fetched Asana via service.");
    return new Response(JSON.stringify(asana), {
      // Return the AsanaDTO
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // 'Cache-Control': 'public, max-age=3600'
      },
    });
  } catch (err: unknown) {
    // Step 7: Catch errors thrown by the service (or unexpected errors)
    logger.error({ path, asanaId, error: err }, "Error occurred while fetching asana via service.");
    // Determine if it was a specific DB error or a generic one based on service implementation if needed
    // For now, return a generic 500
    return new Response(JSON.stringify({ error: "An internal server error occurred while processing the request." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
