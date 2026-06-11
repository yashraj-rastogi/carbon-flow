import { connectToDatabase } from '@/lib/db';
import { CarbonLog } from '@/lib/models';
import { updateHabitState } from '@/lib/mdp';
import { preprocessImage } from '@/lib/preprocess';
import { calculateEmissions } from '@/lib/egrid';
import { extractWithCascade } from '@/lib/gemini';
import { MAX_FILE_SIZE_BYTES } from '@/constants';
import { BILL_SCHEMA, VOICE_SCHEMA, BILL_EXTRACTION_PROMPT, VOICE_EXTRACTION_PROMPT } from '@/constants/schemas';
import {
  authenticateRequest,
  createSuccessResponse,
  createErrorResponse,
  getErrorMessage,
} from '@/lib/api-utils';

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
  extractedData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const co2EmissionsKg = (extractedData.carbonDeltaKg as number) || 0;

  const log = new CarbonLog({
    userId,
    type: 'voice_log',
    fileName,
    rawText: (extractedData.transcript as string) || '',
    billDetails: {
      utilityCompany: 'Voice Log Integration',
      billingPeriod: new Date().toLocaleDateString(),
      consumption: (extractedData.quantity as number) || 0,
      units: (extractedData.units as string) || 'units',
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
  extractedData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const calcResult = calculateEmissions(
    (extractedData.billType as string) || 'electricity',
    (extractedData.consumption as number) || 0,
    extractedData.state as string | undefined
  );

  const log = new CarbonLog({
    userId,
    type: (extractedData.billType as string) || 'electricity',
    fileName,
    rawText: (extractedData.explanation as string) || '',
    billDetails: {
      utilityCompany: extractedData.utilityCompany as string,
      billingPeriod: extractedData.billingPeriod as string,
      amountDue: extractedData.amountDue as number,
      consumption: extractedData.consumption as number,
      units: extractedData.units as string,
      zipCode: extractedData.zipCode as string,
      state: extractedData.state as string,
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

    console.log(`Processing file: ${file.name}, type: ${mimeType}, size: ${fileBuffer.length} bytes`);

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
      schema as unknown as Record<string, unknown>
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
