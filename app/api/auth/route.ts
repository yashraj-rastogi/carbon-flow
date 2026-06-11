import { connectToDatabase } from '@/lib/db';
import { User, HabitState } from '@/lib/models';
import { generateToken } from '@/lib/auth';
import { MAX_USERNAME_LENGTH, MDP_INITIAL_STRENGTH } from '@/constants';
import {
  createSuccessResponse,
  createErrorResponse,
  getErrorMessage,
  parseJsonBody,
  sanitizeString,
} from '@/lib/api-utils';

/** Regex pattern for valid usernames: alphanumeric, underscores, hyphens. */
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Creates a new user and initialises their habit state in the database.
 *
 * @param username - Validated username string.
 * @param email - Email address (or generated default).
 * @returns The newly created Mongoose user document.
 */
async function createUserWithHabitState(
  username: string,
  email: string
): Promise<{ _id: { toString(): string }; username: string; email: string }> {
  const user = new User({
    username,
    email,
    password: 'mock_password_hash',
  });
  await user.save();

  const habitState = new HabitState({
    userId: user._id,
    habitStrength: MDP_INITIAL_STRENGTH,
    lastLoggedAt: new Date(),
    history: [],
  });
  await habitState.save();

  return user;
}

/**
 * POST /api/auth
 *
 * Handles user registration and login.
 * On login, auto-creates the user if they don't exist (convenience for MVP).
 */
export async function POST(request: Request): Promise<Response> {
  try {
    await connectToDatabase();

    const body = await parseJsonBody(request);
    const { username: rawUsername, email, action } = body;

    // Validate username presence and type
    if (!rawUsername || typeof rawUsername !== 'string') {
      return createErrorResponse('Username is required', 400);
    }

    // Sanitize and validate username
    const username = sanitizeString(rawUsername as string);

    if (username.length === 0) {
      return createErrorResponse('Username cannot be empty', 400);
    }

    if (username.length > MAX_USERNAME_LENGTH) {
      return createErrorResponse(
        `Username must be ${MAX_USERNAME_LENGTH} characters or fewer`,
        400
      );
    }

    if (!USERNAME_PATTERN.test(username)) {
      return createErrorResponse(
        'Username may only contain letters, numbers, underscores, and hyphens',
        400
      );
    }

    const userEmail = (email as string) || `${username}@example.com`;
    let user = await User.findOne({ username });

    if (action === 'register') {
      if (user) {
        return createErrorResponse('User already exists', 400);
      }
      user = await createUserWithHabitState(username, userEmail);
    } else {
      // Login — auto-create if user doesn't exist (MVP convenience)
      if (!user) {
        user = await createUserWithHabitState(username, userEmail);
      }
    }

    const token = generateToken({
      id: user._id.toString(),
      username: user.username,
    });

    return createSuccessResponse({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error: unknown) {
    console.error('Auth API Error:', error);
    return createErrorResponse(getErrorMessage(error));
  }
}
