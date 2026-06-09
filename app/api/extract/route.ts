import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { connectToDatabase } from '@/lib/db';
import { CarbonLog } from '@/lib/models';
import { getAuthUser } from '@/lib/auth';
import { preprocessImage } from '@/lib/preprocess';
import { calculateEmissions } from '@/lib/egrid';
import { updateHabitState } from '@/lib/mdp';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// JSON schema for Utility Bills
const BILL_SCHEMA = {
  type: 'OBJECT',
  properties: {
    utilityCompany: { type: 'STRING' },
    billingPeriod: { type: 'STRING', description: 'The dates of service, e.g. Oct 1 - Oct 31, 2024' },
    amountDue: { type: 'NUMBER', description: 'Total charges for the period' },
    consumption: { type: 'NUMBER', description: 'The numeric usage amount (e.g. 350)' },
    units: { type: 'STRING', description: 'kWh, therms, CCF, gallons, etc.' },
    zipCode: { type: 'STRING' },
    state: { type: 'STRING', description: 'Two-letter US state code, e.g. CA, NY, TX' },
    billType: { type: 'STRING', description: 'Must be one of: electricity, gas, water, receipt' },
    confidenceScore: { type: 'NUMBER', description: 'Confidence in extraction from 0.0 (no confidence) to 1.0 (certain)' },
    explanation: { type: 'STRING', description: 'Brief explanation of key figures found' }
  },
  required: ['utilityCompany', 'consumption', 'units', 'billType', 'confidenceScore']
};

// JSON schema for Carbon Voice Logs
const VOICE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    transcript: { type: 'STRING', description: 'Full transcription of the voice memo' },
    actionType: { type: 'STRING', description: 'One of: electricity, gas, water, transport, food, waste, or conservation' },
    quantity: { type: 'NUMBER', description: 'Numerical amount associated with the action (e.g. 15)' },
    units: { type: 'STRING', description: 'Units (e.g. miles, hours, kWh, gallons)' },
    carbonDeltaKg: { type: 'NUMBER', description: 'Estimated carbon offset/emissions generated in kg. Positive for emissions, negative for savings/conservation.' },
    confidenceScore: { type: 'NUMBER', description: 'Confidence in interpretation from 0.0 to 1.0' },
    explanation: { type: 'STRING', description: 'Analysis of what the user logged' }
  },
  required: ['transcript', 'actionType', 'carbonDeltaKg', 'confidenceScore']
};

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Valid token required.' }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    let fileBuffer: any = Buffer.from(arrayBuffer);
    let mimeType = file.type;
    let isAudio = mimeType.startsWith('audio/') || file.name.endsWith('.wav') || file.name.endsWith('.mp3') || file.name.endsWith('.m4a');
    let isPDF = mimeType === 'application/pdf' || file.name.endsWith('.pdf');

    console.log(`Processing file: ${file.name}, type: ${mimeType}, size: ${fileBuffer.length} bytes`);

    // 3. Preprocess if it is an image
    if (mimeType.startsWith('image/')) {
      try {
        const preprocessed = await preprocessImage(fileBuffer);
        fileBuffer = preprocessed.buffer;
        mimeType = preprocessed.mimeType;
      } catch (preprocessError) {
        console.warn('Preprocessing failed, using original file buffer:', preprocessError);
      }
    }

    // Convert to base64 for Gemini payload
    const base64Data = fileBuffer.toString('base64');
    let modelName = 'gemini-2.5-flash'; // Standard model
    let extractedJson: any = null;
    let modelUsed = 'gemini-2.5-flash';
    let tokenUsage = { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 };

    await connectToDatabase();

    if (isAudio) {
      // Process voice log
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || 'audio/wav'
            }
          },
          'Transcribe this audio, identify the sustainability or energy-related action, estimate any carbon impacts, and extract structured fields.'
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: VOICE_SCHEMA,
          temperature: 0.1
        }
      });

      extractedJson = JSON.parse(response.text || '{}');
      console.log('Gemini Audio Response:', extractedJson);
      modelUsed = modelName;
      tokenUsage = {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0
      };

      // Cascade logic for low confidence in voice
      if (extractedJson.confidenceScore < 0.7) {
        console.log('Low confidence on audio. Cascading to Gemini 2.5 Pro...');
        const proResponse = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: [
            { inlineData: { data: base64Data, mimeType: mimeType || 'audio/wav' } },
            'Transcribe this audio, identify the sustainability or energy-related action, estimate any carbon impacts, and extract structured fields.'
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: VOICE_SCHEMA,
            temperature: 0.1
          }
        });
        extractedJson = JSON.parse(proResponse.text || '{}');
        modelUsed = 'gemini-2.5-pro';
        tokenUsage = {
          promptTokens: proResponse.usageMetadata?.promptTokenCount || 0,
          candidatesTokens: proResponse.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: proResponse.usageMetadata?.totalTokenCount || 0
        };
      }

      // Calculate carbon impact for voice log
      const co2EmissionsKg = extractedJson.carbonDeltaKg || 0;

      // Save voice log to database
      const log = new CarbonLog({
        userId: authUser.userId,
        type: 'voice_log',
        fileName: file.name,
        rawText: extractedJson.transcript,
        billDetails: {
          utilityCompany: 'Voice Log Integration',
          billingPeriod: new Date().toLocaleDateString(),
          consumption: extractedJson.quantity || 0,
          units: extractedJson.units || 'units',
          state: 'US'
        },
        co2EmissionsKg,
      });
      await log.save();

      // Trigger MDP state machine
      // If emissions is negative (savings), we treat it as an active positive logging.
      const mdpResult = await updateHabitState(authUser.userId, 'log', co2EmissionsKg);

      return NextResponse.json({
        success: true,
        dataType: 'voice_log',
        data: extractedJson,
        co2EmissionsKg,
        mdp: mdpResult,
        modelUsed,
        tokenUsage
      });

    } else {
      // Process utility bill (image/PDF)
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || 'application/pdf'
            }
          },
          'Analyze this utility bill/receipt, find the consumption figures, units (kWh/therms/gallons/etc.), billing period, state, zip code, and utility name.'
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: BILL_SCHEMA,
          temperature: 0.1
        }
      });

      extractedJson = JSON.parse(response.text || '{}');
      console.log('Gemini Bill Response:', extractedJson);
      modelUsed = modelName;
      tokenUsage = {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0
      };

      // Cascade logic: check if confidence score is low or if PDF has multiple pages (indirectly cascading)
      if (extractedJson.confidenceScore < 0.7) {
        console.log('Low confidence on bill extraction. Cascading to Gemini 2.5 Pro...');
        const proResponse = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: [
            { inlineData: { data: base64Data, mimeType: mimeType || 'application/pdf' } },
            'Analyze this utility bill/receipt, find the consumption figures, units (kWh/therms/gallons/etc.), billing period, state, zip code, and utility name.'
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: BILL_SCHEMA,
            temperature: 0.1
          }
        });
        extractedJson = JSON.parse(proResponse.text || '{}');
        modelUsed = 'gemini-2.5-pro';
        tokenUsage = {
          promptTokens: proResponse.usageMetadata?.promptTokenCount || 0,
          candidatesTokens: proResponse.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: proResponse.usageMetadata?.totalTokenCount || 0
        };
      }

      // Calculate localized emissions
      const calcResult = calculateEmissions(
        extractedJson.billType || 'electricity',
        extractedJson.consumption || 0,
        extractedJson.state
      );

      // Save log to database
      const log = new CarbonLog({
        userId: authUser.userId,
        type: extractedJson.billType || 'electricity',
        fileName: file.name,
        rawText: extractedJson.explanation,
        billDetails: {
          utilityCompany: extractedJson.utilityCompany,
          billingPeriod: extractedJson.billingPeriod,
          amountDue: extractedJson.amountDue,
          consumption: extractedJson.consumption,
          units: extractedJson.units,
          zipCode: extractedJson.zipCode,
          state: extractedJson.state
        },
        co2EmissionsKg: calcResult.co2EmissionsKg,
        eGRIDSubregion: calcResult.subregion,
        eGRIDFactor: calcResult.factor,
      });
      await log.save();

      // Trigger MDP state machine
      const mdpResult = await updateHabitState(authUser.userId, 'log', calcResult.co2EmissionsKg);

      return NextResponse.json({
        success: true,
        dataType: 'bill',
        data: extractedJson,
        co2EmissionsKg: calcResult.co2EmissionsKg,
        eGRIDSubregion: calcResult.subregion,
        mdp: mdpResult,
        modelUsed,
        tokenUsage
      });
    }

  } catch (error: any) {
    console.error('Extract API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
