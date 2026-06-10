/**
 * @jest-environment node
 */
import { POST } from '@/app/api/extract/route';
import { getAuthUser } from '@/lib/auth';
import { preprocessImage } from '@/lib/preprocess';
import { calculateEmissions } from '@/lib/egrid';
import { updateHabitState } from '@/lib/mdp';
import { connectToDatabase } from '@/lib/db';
import { CarbonLog } from '@/lib/models';

// Define mock on global object to avoid temporal dead zone / hoisting issues
(global as any).mockGenerateContent = jest.fn();
const mockGenerateContent = (global as any).mockGenerateContent;

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: (...args: any[]) => {
            return (global as any).mockGenerateContent(...args);
          },
        },
      };
    }),
  };
});

jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn(),
}));

jest.mock('@/lib/preprocess', () => ({
  preprocessImage: jest.fn(),
}));

jest.mock('@/lib/egrid', () => ({
  calculateEmissions: jest.fn(),
}));

jest.mock('@/lib/mdp', () => ({
  updateHabitState: jest.fn(),
}));

jest.mock('@/lib/models', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const mockCarbonLog = jest.fn().mockImplementation((data) => ({
    ...data,
    save: mockSave,
  }));
  return {
    CarbonLog: mockCarbonLog,
  };
});

describe('Extract API Endpoint (/api/extract)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    (getAuthUser as jest.Mock).mockReturnValue(null);
    const request = new Request('http://localhost/api/extract', { method: 'POST' });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 if file is missing', async () => {
    (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123' });
    const formData = new FormData();

    const request = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('No file uploaded');
  });

  it('returns 400 if file is too large', async () => {
    (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123' });
    const largeBlob = new Blob([new Uint8Array(9 * 1024 * 1024)]); // 9MB
    const formData = new FormData();
    formData.append('file', largeBlob, 'large.jpg');

    const request = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('File size exceeds maximum limit of 8MB');
  });

  it('successfully extracts audio voice log', async () => {
    (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123' });
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        transcript: 'Shortened shower',
        actionType: 'water',
        carbonDeltaKg: -0.4,
        confidenceScore: 0.9,
        quantity: 5,
        units: 'minutes',
      }),
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
    });
    (updateHabitState as jest.Mock).mockResolvedValue({ currentStrength: 6 });

    const formData = new FormData();
    formData.append('file', new Blob(['audio-data'], { type: 'audio/wav' }), 'voice.wav');

    const request = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.dataType).toBe('voice_log');
    expect(json.co2EmissionsKg).toBe(-0.4);
    expect(json.mdp.currentStrength).toBe(6);
  });

  it('successfully extracts image utility bill', async () => {
    (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123' });
    (preprocessImage as jest.Mock).mockResolvedValue({
      buffer: Buffer.from('preprocessed'),
      mimeType: 'image/jpeg',
    });
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        utilityCompany: 'Utility Co',
        billingPeriod: '10/24',
        amountDue: 50,
        consumption: 100,
        units: 'kWh',
        state: 'CA',
        billType: 'electricity',
        confidenceScore: 0.8,
      }),
      usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 10, totalTokenCount: 30 },
    });
    (calculateEmissions as jest.Mock).mockReturnValue({
      co2EmissionsKg: 24,
      subregion: 'CAMX',
      factor: 0.24,
    });
    (updateHabitState as jest.Mock).mockResolvedValue({ currentStrength: 6 });

    const formData = new FormData();
    formData.append('file', new Blob(['image-data'], { type: 'image/png' }), 'bill.png');

    const request = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.dataType).toBe('bill');
    expect(json.co2EmissionsKg).toBe(24);
    expect(json.eGRIDSubregion).toBe('CAMX');
    expect(preprocessImage).toHaveBeenCalled();
  });

  it('cascades to pro model when confidence score is low', async () => {
    (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123' });
    (preprocessImage as jest.Mock).mockResolvedValue({
      buffer: Buffer.from('preprocessed'),
      mimeType: 'image/jpeg',
    });

    // 1st call returns low confidence
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        utilityCompany: 'Utility Co',
        billingPeriod: '10/24',
        amountDue: 50,
        consumption: 100,
        units: 'kWh',
        state: 'CA',
        billType: 'electricity',
        confidenceScore: 0.4,
      }),
      usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 10, totalTokenCount: 30 },
    });

    // 2nd call (Pro cascade) returns high confidence
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        utilityCompany: 'Utility Co',
        billingPeriod: '10/24',
        amountDue: 50,
        consumption: 100,
        units: 'kWh',
        state: 'CA',
        billType: 'electricity',
        confidenceScore: 0.9,
      }),
      usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 20, totalTokenCount: 70 },
    });

    (calculateEmissions as jest.Mock).mockReturnValue({
      co2EmissionsKg: 24,
      subregion: 'CAMX',
      factor: 0.24,
    });
    (updateHabitState as jest.Mock).mockResolvedValue({ currentStrength: 6 });

    const formData = new FormData();
    formData.append('file', new Blob(['image-data'], { type: 'image/png' }), 'bill.png');

    const request = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.modelUsed).toBe('gemini-2.5-pro'); // Cascaded to Pro
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });
});
