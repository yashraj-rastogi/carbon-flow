import { connectToDatabase } from '@/lib/db';
import { CarbonLog } from '@/lib/models';
import { updateHabitState } from '@/lib/mdp';
import { preprocessImage } from '@/lib/preprocess';
import { calculateEmissions } from '@/lib/egrid';
import { extractWithCascade } from '@/lib/gemini';
import { MAX_FILE_SIZE_BYTES, ACCEPTED_FILE_TYPES, ACCEPTED_FILE_INPUT } from '@/constants';
import { BILL_SCHEMA, VOICE_SCHEMA, BILL_EXTRACTION_PROMPT, VOICE_EXTRACTION_PROMPT } from '@/constants/schemas';
import { NextResponse } from 'next/server';
import {
  authenticateRequest,
  createSuccessResponse,
  createErrorResponse,
  getErrorMessage,
} from '@/lib/api-utils';
import type { VoiceExtractionData, BillExtractionData, GeminiSchema } from '@/types';
import { RateLimiter } from '@/lib/rate-limit';

const extractRateLimiter = new RateLimiter({ interval: 60000, limit: 10 });

/**
 * Returns true if the file is an audio recording based on MIME type or extension.
 */
function isAudioFile(mimeType: string, fileName: string): boolean {
  return (
    mimeType.startsWith('audio/') ||
    fileName.endsWith('.wav') ||
    fileName.endsWith('.mp3') ||
    fileName.endsWith('.m4a')
  );
}

/**
 * Saves a voice log entry to the database and triggers an MDP transition.
 */
async function processVoiceLog(
  userId: string,
  fileName: string,
  extractedData: VoiceExtractionData
): Promise<Record<string, unknown>> {
  const co2EmissionsKg = extractedData.carbonDeltaKg || 0;

  const log = new CarbonLog({
    userId,
    type: 'voice_log',
    fileName,
    rawText: extractedData.transcript || '',
    billDetails: {
      utilityCompany: 'Voice Log Integration',
      billingPeriod: new Date().toLocaleDateString(),
      consumption: extractedData.quantity || 0,
      units: extractedData.units || 'units',
      state: 'US',
    },
    co2EmissionsKg,
  });
  await log.save();

  const mdpResult = await updateHabitState(userId, 'log', co2EmissionsKg);

  return { dataType: 'voice_log', data: extractedData, co2EmissionsKg, mdp: mdpResult };
}

/**
 * Saves a utility bill entry to the database and triggers an MDP transition.
 */
async function processBillEntry(
  userId: string,
  fileName: string,
  extractedData: BillExtractionData
): Promise<Record<string, unknown>> {
  const calcResult = calculateEmissions(
    extractedData.billType || 'electricity',
    extractedData.consumption || 0,
    extractedData.state
  );

  const log = new CarbonLog({
    userId,
    type: extractedData.billType || 'electricity',
    fileName,
    rawText: extractedData.explanation || '',
    billDetails: {
      utilityCompany: extractedData.utilityCompany,
      billingPeriod: extractedData.billingPeriod,
      amountDue: extractedData.amountDue,
      consumption: extractedData.consumption,
      units: extractedData.units,
      zipCode: extractedData.zipCode,
      state: extractedData.state,
    },
    co2EmissionsKg: calcResult.co2EmissionsKg,
    eGRIDSubregion: calcResult.subregion,
    eGRIDFactor: calcResult.factor,
  });
  await log.save();

  const mdpResult = await updateHabitState(userId, 'log', calcResult.co2EmissionsKg);

  return {
    dataType: 'bill',
    data: extractedData,
    co2EmissionsKg: calcResult.co2EmissionsKg,
    eGRIDSubregion: calcResult.subregion,
    mdp: mdpResult,
  };
}

/**
 * POST /api/extract
 *
 * Accepts a file upload (image, PDF, or audio) and extracts carbon data
 * using Gemini's multimodal AI with a confidence-gated Flash → Pro cascade.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Authenticate
    const [authUser, authError] = authenticateRequest(request);
    if (authError) return authError;

    // Rate Limit Check
    const rateLimit = extractRateLimiter.limitCheck(authUser!.userId);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 2. Parse and validate file
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return createErrorResponse('No file uploaded', 400);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return createErrorResponse('File size exceeds maximum limit of 8MB', 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    let fileBuffer: Buffer = Buffer.from(arrayBuffer);
    let mimeType = file.type;
    const isAudio = isAudioFile(mimeType, file.name);

    // Validate MIME type against allowlist
    const isAcceptedImageOrPdf = ACCEPTED_FILE_TYPES.includes(mimeType as any);
    if (!isAudio && !isAcceptedImageOrPdf) {
      return createErrorResponse(
        `Unsupported file type. Accepted types: ${ACCEPTED_FILE_INPUT}, plus common audio formats.`,
        400
      );
    }

    // 3. Preprocess images for optimal OCR
    if (mimeType.startsWith('image/')) {
      try {
        const preprocessed = await preprocessImage(fileBuffer);
        fileBuffer = preprocessed.buffer;
        mimeType = preprocessed.mimeType;
      } catch (preprocessError) {
        console.warn('Preprocessing failed, using original file buffer:', preprocessError);
      }
    }

    // 4. Extract via Gemini cascade
    const base64Data = fileBuffer.toString('base64');
    await connectToDatabase();

    const schema = isAudio ? VOICE_SCHEMA : BILL_SCHEMA;
    const prompt = isAudio ? VOICE_EXTRACTION_PROMPT : BILL_EXTRACTION_PROMPT;
    const fallbackMime = isAudio ? 'audio/wav' : 'application/pdf';

    const extraction = await extractWithCascade(
      base64Data,
      mimeType || fallbackMime,
      prompt,
      schema as unknown as GeminiSchema
    );

    // 5. Save to database and trigger MDP
    const result = isAudio
      ? await processVoiceLog(authUser!.userId, file.name, extraction.data)
      : await processBillEntry(authUser!.userId, file.name, extraction.data);

    return createSuccessResponse({
      ...result,
      modelUsed: extraction.modelUsed,
      tokenUsage: extraction.tokenUsage,
    });
  } catch (error: unknown) {
    console.error('Extract API Error:', error);
    return createErrorResponse(getErrorMessage(error));
  }
}
