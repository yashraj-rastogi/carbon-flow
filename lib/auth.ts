export interface AuthUser {
  userId: string;
  username: string;
}

/**
 * Extracts and decodes the mock JWT token from the Request headers.
 * Token is expected to be a base64 encoded JSON string of AuthUser.
 *
 * @param request - The incoming HTTP request.
 * @returns The decoded AuthUser payload, or null if missing or invalid.
 */
export function getAuthUser(request: Request): AuthUser | null {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const user = JSON.parse(decoded);
    
    if (user && user.userId && user.username) {
      return user as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generates a mock JWT token from a user payload.
 *
 * @param user - Object containing the user's ID and username.
 * @returns A base64 encoded token string.
 */
export function generateToken(user: { id: string; username: string }): string {
  const payload: AuthUser = {
    userId: user.id,
    username: user.username
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
