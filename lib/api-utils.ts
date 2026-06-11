import { NextResponse } from 'next/server';
import { getAuthUser, type AuthUser } from '@/lib/auth';

/**
 * Creates a standardized JSON success response.
 *
 * @param data - Payload to include in the response body.
 * @param status - HTTP status code (default: 200).
 * @returns A NextResponse with `{ success: true, ...data }`.
 */
export function createSuccessResponse(
  data: Record<string, unknown>,
  status: number = 200
): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status });
}

/**
 * Creates a standardized JSON error response.
 *
 * @param message - Human-readable error description.
 * @param status - HTTP status code (default: 500).
 * @returns A NextResponse with `{ success: false, error: message }`.
 */
export function createErrorResponse(
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Extracts an error message from an unknown caught value.
 *
 * @param error - The caught error (typically `unknown`).
 * @returns A string message suitable for API responses.
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Internal Server Error';
}

/**
 * Authenticates a request and returns the user or an error response.
 *
 * Usage:
 * ```ts
 * const [authUser, errorResponse] = authenticateRequest(request);
 * if (errorResponse) return errorResponse;
 * // authUser is guaranteed non-null here
 * ```
 *
 * @param request - The incoming HTTP request.
 * @returns A tuple of [AuthUser | null, NextResponse | null].
 */
export function authenticateRequest(
  request: Request
): [AuthUser | null, NextResponse | null] {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return [null, createErrorResponse('Unauthorized. Valid token required.', 401)];
  }
  return [authUser, null];
}

/**
 * Safely parses the JSON body of a request.
 * Returns an empty object if parsing fails (malformed JSON).
 *
 * @param request - The incoming HTTP request.
 * @returns The parsed body as a Record.
 */
export async function parseJsonBody(
  request: Request
): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Validates that all required fields are present and non-empty in a body object.
 *
 * @param body - The parsed request body.
 * @param fields - Array of required field names.
 * @returns An error message string if validation fails, or null if all fields are present.
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `${field} is required`;
    }
  }
  return null;
}

/**
 * Sanitizes a string input by stripping HTML tags and trimming whitespace.
 *
 * @param input - The raw string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeString(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}
