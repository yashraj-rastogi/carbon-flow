import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CarbonLog } from '@/lib/models';
import {
  authenticateRequest,
  createSuccessResponse,
  createErrorResponse,
  getErrorMessage,
} from '@/lib/api-utils';
import { extractWithCascade } from '@/lib/gemini';
import { INSIGHTS_SCHEMA, INSIGHTS_PROMPT } from '@/constants/schemas';
import type { InsightsExtractionData, GeminiSchema } from '@/types';
import { RateLimiter } from '@/lib/rate-limit';

const insightsRateLimiter = new RateLimiter({ interval: 60000, limit: 5 });

/**
 * GET /api/insights
 * Generates AI-driven personalized insights based on the user's recent carbon logs.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    // 1. Authenticate Request
    const [authUser, authError] = authenticateRequest(request);
    if (authError) return authError;

    // 2. Rate Limiting (max 5 per minute)
    const rateLimit = insightsRateLimiter.limitCheck(authUser!.userId);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    await connectToDatabase();

    // 3. Fetch recent carbon logs
    // @ts-ignore - mongoose type bug
    const recentLogs = await CarbonLog.find({ userId: authUser!.userId })
      .sort({ dateLogged: -1 })
      .limit(15)
      .lean();

    if (!recentLogs || recentLogs.length === 0) {
      return createSuccessResponse({
        insights: [
          {
            title: 'Start Logging!',
            description: 'Log your first utility bill or voice memo to get personalized carbon-saving insights.',
            estimatedSavingsKg: 0,
          },
        ],
      });
    }

    // 4. Format logs into a text summary for Gemini
    const logSummary = recentLogs
      .map(
        (log) =>
          `- ${new Date(log.dateLogged).toLocaleDateString()}: [${log.type}] ${
            log.co2EmissionsKg > 0 ? '+' : ''
          }${log.co2EmissionsKg.toFixed(2)} kg CO2. Context: ${log.rawText || JSON.stringify(log.billDetails)}`
      )
      .join('\n');

    const promptWithData = `${INSIGHTS_PROMPT}\n\nUser Data:\n${logSummary}`;

    // 5. Generate Insights using Gemini
    // We pass empty base64 string because we are just sending a text prompt
    const extraction = await extractWithCascade(
      '',
      'text/plain',
      promptWithData,
      INSIGHTS_SCHEMA as unknown as GeminiSchema
    );

    const data = extraction.data as InsightsExtractionData;

    if (!data.insights || !Array.isArray(data.insights) || data.insights.length === 0) {
      throw new Error('Failed to generate structured insights');
    }

    return createSuccessResponse({ insights: data.insights });
  } catch (error) {
    console.error('Insights generation error:', error);
    return createErrorResponse(getErrorMessage(error), 500);
  }
}
