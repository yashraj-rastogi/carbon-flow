import { connectToDatabase } from '@/lib/db';
import { CarbonLog, HabitState } from '@/lib/models';
import { processOmissionsIfOverdue, updateHabitState } from '@/lib/mdp';
import type { CategoryEmissions } from '@/types';
import {
  authenticateRequest,
  createSuccessResponse,
  createErrorResponse,
  getErrorMessage,
  parseJsonBody,
} from '@/lib/api-utils';
import { validateSchema } from '@/lib/validation';

/** Allowed manual actions for the POST endpoint. */
const ALLOWED_MANUAL_ACTIONS = ['omission'] as const;

/**
 * Aggregates emission totals from a list of carbon log documents.
 *
 * @param logs - Array of carbon log documents from MongoDB.
 * @returns Total emissions and per-category breakdown.
 */
function aggregateEmissions(
  logs: Array<{ co2EmissionsKg: number; type: string }>
): { totalEmissions: number; categoryEmissions: CategoryEmissions } {
  let totalEmissions = 0;
  const categoryEmissions: CategoryEmissions = {
    electricity: 0,
    gas: 0,
    water: 0,
    voice_log: 0,
    receipt: 0,
  };

  for (const log of logs) {
    totalEmissions += log.co2EmissionsKg;
    const type = log.type as keyof CategoryEmissions;
    if (type in categoryEmissions) {
      categoryEmissions[type] += log.co2EmissionsKg;
    }
  }

  return { totalEmissions, categoryEmissions };
}

/**
 * GET /api/history
 *
 * Returns the user's carbon logs, current habit state, and aggregated metrics.
 * Automatically applies any overdue omission penalties before returning data.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const [authUser, authError] = authenticateRequest(request);
    if (authError) return authError;

    await connectToDatabase();
    const userId = authUser!.userId;

    // 1. Process overdue omissions
    const omissionUpdate = await processOmissionsIfOverdue(userId);
    if (omissionUpdate) {
      console.warn(
        `Applied ${omissionUpdate.appliedOmissionsCount} overdue omissions. New habit strength: ${omissionUpdate.currentStrength}`
      );
    }

    // 2. Fetch logs and habit state in parallel
    const [habitState, logs] = await Promise.all([
      // @ts-ignore - mongoose type bug
      HabitState.findOne({ userId }),
      // @ts-ignore - mongoose type bug
      CarbonLog.find({ userId }).sort({ createdAt: -1 }).limit(50),
    ]);

    // 3. Aggregate metrics
    const { totalEmissions, categoryEmissions } = aggregateEmissions(logs);

    return createSuccessResponse({
      logs,
      habitState: habitState || { habitStrength: 5, history: [] },
      metrics: { totalEmissions, categoryEmissions, logCount: logs.length },
    });
  } catch (error: unknown) {
    console.error('History API GET Error:', error);
    return createErrorResponse(getErrorMessage(error));
  }
}

/**
 * POST /api/history
 *
 * Supports manual MDP actions (e.g., simulating an omission for testing).
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const [authUser, authError] = authenticateRequest(request);
    if (authError) return authError;

    const body = await parseJsonBody(request);
    const validation = validateSchema<{ action: string }>(body, {
      action: { type: 'enum', enumValues: [...ALLOWED_MANUAL_ACTIONS], required: true },
    });

    if (!validation.success) {
      return createErrorResponse('Invalid manual action', 400);
    }

    await connectToDatabase();
    const mdpResult = await updateHabitState(authUser!.userId, 'omission');

    return createSuccessResponse({
      message: 'Manual omission applied successfully',
      mdp: mdpResult,
    });
  } catch (error: unknown) {
    console.error('History API POST Error:', error);
    return createErrorResponse(getErrorMessage(error));
  }
}
