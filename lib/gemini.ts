/**
 * Gemini AI helper utilities for the extraction pipeline.
 *
 * Provides a unified interface for calling Gemini models, tracking token usage,
 * and implementing the confidence-gated cascade (Flash → Pro) pattern.
 * @module lib/gemini
 */

import { GoogleGenAI } from '@google/genai';
import { CONFIDENCE_THRESHOLD, GEMINI_MODEL_FLASH, GEMINI_MODEL_PRO } from '@/constants';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/** Token usage metadata from a Gemini API call. */
export interface GeminiTokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

/** Result of a Gemini structured extraction call. */
export interface GeminiExtractionResult {
  data: Record<string, unknown>;
  modelUsed: string;
  tokenUsage: GeminiTokenUsage;
}

/**
 * Calls a Gemini model with structured JSON output.
 *
 * @param model - The Gemini model identifier (e.g., 'gemini-2.5-flash').
 * @param base64Data - Base64-encoded file content.
 * @param mimeType - MIME type of the file.
 * @param prompt - Text prompt describing the extraction task.
 * @param schema - JSON response schema for structured output.
 * @returns The parsed JSON data, model name, and token usage.
 */
export async function callGemini(
  model: string,
  base64Data: string,
  mimeType: string,
  prompt: string,
  schema: Record<string, unknown>
): Promise<GeminiExtractionResult> {
  const response = await ai.models.generateContent({
    model,
    contents: [
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.1,
    },
  });

  const data = JSON.parse(response.text || '{}') as Record<string, unknown>;
  const tokenUsage: GeminiTokenUsage = {
    promptTokens: response.usageMetadata?.promptTokenCount || 0,
    candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
    totalTokens: response.usageMetadata?.totalTokenCount || 0,
  };

  return { data, modelUsed: model, tokenUsage };
}

/**
 * Performs a confidence-gated cascade extraction.
 *
 * First attempts extraction with Gemini Flash (cheaper/faster).
 * If the confidence score falls below {@link CONFIDENCE_THRESHOLD},
 * automatically retries with Gemini Pro (more capable).
 *
 * @param base64Data - Base64-encoded file content.
 * @param mimeType - MIME type of the file.
 * @param prompt - Text prompt for extraction.
 * @param schema - JSON response schema.
 * @returns The best extraction result (Flash if confident, otherwise Pro).
 */
export async function extractWithCascade(
  base64Data: string,
  mimeType: string,
  prompt: string,
  schema: Record<string, unknown>
): Promise<GeminiExtractionResult> {
  // Step 1: Try with Flash (fast, cheap)
  const flashResult = await callGemini(
    GEMINI_MODEL_FLASH,
    base64Data,
    mimeType,
    prompt,
    schema
  );

  // Step 2: Check confidence — cascade to Pro if below threshold
  const confidence = flashResult.data.confidenceScore as number | undefined;
  if (confidence !== undefined && confidence < CONFIDENCE_THRESHOLD) {
    console.log(
      `Low confidence (${confidence}) on Flash extraction. Cascading to Gemini 2.5 Pro...`
    );
    return callGemini(GEMINI_MODEL_PRO, base64Data, mimeType, prompt, schema);
  }

  return flashResult;
}
