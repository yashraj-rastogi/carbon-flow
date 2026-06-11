/**
 * @jest-environment node
 */
import { callGemini, extractWithCascade } from '@/lib/gemini';

// Mock the GoogleGenAI
const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: (...args: unknown[]) => mockGenerateContent(...args),
        },
      };
    }),
  };
});

describe('Gemini Helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('callGemini', () => {
    it('calls Gemini API and returns parsed result', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ field: 'value', confidenceScore: 0.9 }),
        usageMetadata: {
          promptTokenCount: 100,
          candidatesTokenCount: 50,
          totalTokenCount: 150,
        },
      });

      const result = await callGemini(
        'gemini-2.5-flash',
        'base64data',
        'image/png',
        'Extract data',
        { type: 'OBJECT' }
      );

      expect(result.data.field).toBe('value');
      expect(result.modelUsed).toBe('gemini-2.5-flash');
      expect(result.tokenUsage.totalTokens).toBe(150);
    });

    it('handles missing usage metadata gracefully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ field: 'value' }),
        usageMetadata: undefined,
      });

      const result = await callGemini(
        'gemini-2.5-flash',
        'base64data',
        'image/png',
        'Extract data',
        { type: 'OBJECT' }
      );

      expect(result.tokenUsage.promptTokens).toBe(0);
      expect(result.tokenUsage.candidatesTokens).toBe(0);
      expect(result.tokenUsage.totalTokens).toBe(0);
    });

    it('handles empty response text', async () => {
      mockGenerateContent.mockResolvedValue({
        text: '',
        usageMetadata: { totalTokenCount: 10 },
      });

      const result = await callGemini(
        'gemini-2.5-flash',
        'base64data',
        'image/png',
        'Extract',
        {}
      );

      expect(result.data).toEqual({});
    });
  });

  describe('extractWithCascade', () => {
    it('returns Flash result when confidence is high', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ confidenceScore: 0.85, data: 'flash' }),
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
      });

      const result = await extractWithCascade(
        'base64data',
        'image/png',
        'Extract',
        { type: 'OBJECT' }
      );

      expect(result.modelUsed).toBe('gemini-2.5-flash');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('cascades to Pro when confidence is low', async () => {
      // Flash returns low confidence
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({ confidenceScore: 0.3, data: 'flash' }),
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
      });

      // Pro returns high confidence
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({ confidenceScore: 0.95, data: 'pro' }),
        usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 20, totalTokenCount: 70 },
      });

      const result = await extractWithCascade(
        'base64data',
        'image/png',
        'Extract',
        { type: 'OBJECT' }
      );

      expect(result.modelUsed).toBe('gemini-2.5-pro');
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('does not cascade when confidence is exactly at threshold', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ confidenceScore: 0.7 }),
        usageMetadata: { totalTokenCount: 10 },
      });

      const result = await extractWithCascade(
        'base64data',
        'image/png',
        'Extract',
        {}
      );

      // 0.7 is the threshold, so it should NOT cascade (only cascades when < threshold)
      expect(result.modelUsed).toBe('gemini-2.5-flash');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('does not cascade when confidenceScore is missing', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ data: 'no-confidence' }),
        usageMetadata: { totalTokenCount: 10 },
      });

      const result = await extractWithCascade(
        'base64data',
        'image/png',
        'Extract',
        {}
      );

      expect(result.modelUsed).toBe('gemini-2.5-flash');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });
  });
});
