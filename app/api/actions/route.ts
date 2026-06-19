import { connectToDatabase } from '@/lib/db';
import { Action, CarbonLog } from '@/lib/models';
import { updateHabitState } from '@/lib/mdp';
import { SEED_ACTIONS } from '@/constants/seed-actions';
import {
  authenticateRequest,
  createSuccessResponse,
  createErrorResponse,
  getErrorMessage,
  parseJsonBody,
} from '@/lib/api-utils';
import { validateSchema } from '@/lib/validation';

/**
 * GET /api/actions
 *
 * Returns the curated micro-habit action library.
 * Auto-seeds the database on first request if the collection is empty.
 */
export async function GET(): Promise<Response> {
  try {
    await connectToDatabase();

    let actions = await Action.find();

    // Auto-seed if collection is empty
    if (actions.length === 0) {
      console.warn('Action database empty. Seeding curated actions...');
      await Action.insertMany([...SEED_ACTIONS]);
      actions = await Action.find();
    }

    return createSuccessResponse({ actions });
  } catch (error: unknown) {
    console.error('Actions GET Error:', error);
    return createErrorResponse(getErrorMessage(error));
  }
}

/**
 * POST /api/actions
 *
 * Logs a micro-habit action, creates a carbon savings entry,
 * and triggers an MDP state transition.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Authenticate
    const [authUser, authError] = authenticateRequest(request);
    if (authError) return authError;

    // 2. Validate input
    const body = await parseJsonBody(request);
    const validation = validateSchema<{ actionId: string }>(body, {
      actionId: { type: 'string', required: true },
    });

    if (!validation.success) {
      return createErrorResponse(validation.error!, 400);
    }

    const { actionId } = validation.data!;

    await connectToDatabase();

    // 3. Find the action
    // @ts-ignore - mongoose type bug
    const action = await Action.findById(actionId);
    if (!action) {
      return createErrorResponse('Action not found', 404);
    }

    // 4. Create carbon log (negative impactKg = CO₂ savings)
    const log = new CarbonLog({
      userId: authUser!.userId,
      type: action.category,
      fileName: 'Manual Action',
      rawText: action.description,
      billDetails: {
        utilityCompany: 'Self-Logged Micro-habit',
        billingPeriod: new Date().toLocaleDateString(),
        consumption: 1,
        units: 'action',
        state: 'US',
      },
      co2EmissionsKg: action.impactKg,
    });
    await log.save();

    // 5. Trigger MDP transition
    const mdpResult = await updateHabitState(authUser!.userId, 'log', action.impactKg);

    return createSuccessResponse({
      message: `Completed action: ${action.name}`,
      carbonDeltaKg: action.impactKg,
      mdp: mdpResult,
    });
  } catch (error: unknown) {
    console.error('Actions POST Error:', error);
    return createErrorResponse(getErrorMessage(error));
  }
}
