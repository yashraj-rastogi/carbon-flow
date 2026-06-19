/**
 * Gemini AI structured output schemas.
 *
 * These schemas are passed to the Gemini API's `responseSchema` parameter
 * to enforce structured JSON extraction from multimodal inputs.
 * @module constants/schemas
 */

/** JSON schema for structured extraction from utility bill images/PDFs. */
export const BILL_SCHEMA = {
  type: 'OBJECT',
  properties: {
    utilityCompany: { type: 'STRING' },
    billingPeriod: {
      type: 'STRING',
      description: 'The dates of service, e.g. Oct 1 - Oct 31, 2024',
    },
    amountDue: { type: 'NUMBER', description: 'Total charges for the period' },
    consumption: {
      type: 'NUMBER',
      description: 'The numeric usage amount (e.g. 350)',
    },
    units: { type: 'STRING', description: 'kWh, therms, CCF, gallons, etc.' },
    zipCode: { type: 'STRING' },
    state: {
      type: 'STRING',
      description: 'Two-letter US state code, e.g. CA, NY, TX',
    },
    billType: {
      type: 'STRING',
      description: 'Must be one of: electricity, gas, water, receipt',
    },
    confidenceScore: {
      type: 'NUMBER',
      description: 'Confidence in extraction from 0.0 (no confidence) to 1.0 (certain)',
    },
    explanation: {
      type: 'STRING',
      description: 'Brief explanation of key figures found',
    },
  },
  required: ['utilityCompany', 'consumption', 'units', 'billType', 'confidenceScore'],
} as const;

/** JSON schema for structured extraction from voice memos / audio logs. */
export const VOICE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    transcript: {
      type: 'STRING',
      description: 'Full transcription of the voice memo',
    },
    actionType: {
      type: 'STRING',
      description:
        'One of: electricity, gas, water, transport, food, waste, or conservation',
    },
    quantity: {
      type: 'NUMBER',
      description: 'Numerical amount associated with the action (e.g. 15)',
    },
    units: {
      type: 'STRING',
      description: 'Units (e.g. miles, hours, kWh, gallons)',
    },
    carbonDeltaKg: {
      type: 'NUMBER',
      description:
        'Estimated carbon offset/emissions generated in kg. Positive for emissions, negative for savings/conservation.',
    },
    confidenceScore: {
      type: 'NUMBER',
      description: 'Confidence in interpretation from 0.0 to 1.0',
    },
    explanation: {
      type: 'STRING',
      description: 'Analysis of what the user logged',
    },
  },
  required: ['transcript', 'actionType', 'carbonDeltaKg', 'confidenceScore'],
} as const;

/** Prompt sent to Gemini for utility bill image/PDF extraction. */
export const BILL_EXTRACTION_PROMPT =
  'Analyze this utility bill/receipt, find the consumption figures, units (kWh/therms/gallons/etc.), billing period, state, zip code, and utility name.';

/** Prompt sent to Gemini for voice memo transcription and analysis. */
export const VOICE_EXTRACTION_PROMPT =
  'Transcribe this audio, identify the sustainability or energy-related action, estimate any carbon impacts, and extract structured fields.';

/** JSON schema for structured personalized insights. */
export const INSIGHTS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    insights: {
      type: 'ARRAY',
      description: 'List of 3 personalized insights',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING', description: 'Short, catchy title for the insight' },
          description: { type: 'STRING', description: 'Actionable and personalized description based on past logs' },
          estimatedSavingsKg: { type: 'NUMBER', description: 'Estimated carbon savings if the user follows this advice (can be 0 or negative)' }
        },
        required: ['title', 'description', 'estimatedSavingsKg']
      }
    }
  },
  required: ['insights']
} as const;

/** Prompt sent to Gemini to generate personalized insights based on carbon logs. */
export const INSIGHTS_PROMPT = 
  'Analyze these recent carbon logs for the user. Generate exactly 3 personalized, actionable insights or recommendations to help them reduce their carbon footprint further. Format the output to match the schema.';
