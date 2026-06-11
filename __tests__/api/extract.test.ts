/**
 * @jest-environment node
 */
import { POST } from '@/app/api/extract/route';
import { getAuthUser } from '@/lib/auth';
import { preprocessImage } from '@/lib/preprocess';
import { calculateEmissions } from '@/lib/egrid';
import { updateHabitState } from '@/lib/mdp';
import { extractWithCascade } from '@/lib/gemini';

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

jest.mock('@/lib/gemini', () => ({
  extractWithCascade: jest.fn(),
}));

jest.mock('@/lib/models', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const mockCarbonLog = jest.fn().mockImplementation((data: Record<string, unknown>) => ({
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
    (extractWithCascade as jest.Mock).mockResolvedValue({
      data: {
        transcript: 'Shortened shower',
        actionType: 'water',
        carbonDeltaKg: -0.4,
        confidenceScore: 0.9,
        quantity: 5,
        units: 'minutes',
      },
      modelUsed: 'gemini-2.5-flash',
      tokenUsage: { promptTokens: 10, candidatesTokens: 5, totalTokens: 15 },
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
    (extractWithCascade as jest.Mock).mockResolvedValue({
      data: {
        utilityCompany: 'Utility Co',
        billingPeriod: '10/24',
        amountDue: 50,
        consumption: 100,
        units: 'kWh',
        state: 'CA',
        billType: 'electricity',
        confidenceScore: 0.8,
      },
      modelUsed: 'gemini-2.5-flash',
      tokenUsage: { promptTokens: 20, candidatesTokens: 10, totalTokens: 30 },
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

    // Cascade result: Pro model used because Flash had low confidence
    (extractWithCascade as jest.Mock).mockResolvedValue({
      data: {
        utilityCompany: 'Utility Co',
        billingPeriod: '10/24',
        amountDue: 50,
        consumption: 100,
        units: 'kWh',
        state: 'CA',
        billType: 'electricity',
        confidenceScore: 0.9,
      },
      modelUsed: 'gemini-2.5-pro',
      tokenUsage: { promptTokens: 50, candidatesTokens: 20, totalTokens: 70 },
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
    expect(json.modelUsed).toBe('gemini-2.5-pro');
    expect(extractWithCascade).toHaveBeenCalledTimes(1);
  });

  it('handles preprocessing failure gracefully', async () => {
    (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123' });
    (preprocessImage as jest.Mock).mockRejectedValue(new Error('sharp failed'));
    (extractWithCascade as jest.Mock).mockResolvedValue({
      data: {
        utilityCompany: 'Test Co',
        consumption: 50,
        units: 'kWh',
        billType: 'electricity',
        confidenceScore: 0.85,
      },
      modelUsed: 'gemini-2.5-flash',
      tokenUsage: { promptTokens: 10, candidatesTokens: 5, totalTokens: 15 },
    });
    (calculateEmissions as jest.Mock).mockReturnValue({
      co2EmissionsKg: 12,
      subregion: 'US_AVERAGE',
      factor: 0.39,
    });
    (updateHabitState as jest.Mock).mockResolvedValue({ currentStrength: 5 });

    const formData = new FormData();
    formData.append('file', new Blob(['img'], { type: 'image/jpeg' }), 'bill.jpg');

    const request = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    // Preprocessing failed but the route should still succeed with original buffer
    expect(json.dataType).toBe('bill');
  });

  it('processes PDF files as utility bills', async () => {
    (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123' });
    (extractWithCascade as jest.Mock).mockResolvedValue({
      data: {
        utilityCompany: 'PDF Utility',
        consumption: 200,
        units: 'therms',
        billType: 'gas',
        confidenceScore: 0.95,
      },
      modelUsed: 'gemini-2.5-flash',
      tokenUsage: { promptTokens: 15, candidatesTokens: 8, totalTokens: 23 },
    });
    (calculateEmissions as jest.Mock).mockReturnValue({
      co2EmissionsKg: 1060,
      factor: 5.3,
    });
    (updateHabitState as jest.Mock).mockResolvedValue({ currentStrength: 7 });

    const formData = new FormData();
    formData.append('file', new Blob(['pdf-data'], { type: 'application/pdf' }), 'bill.pdf');

    const request = new Request('http://localhost/api/extract', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.dataType).toBe('bill');
    expect(json.co2EmissionsKg).toBe(1060);
    // PDF should not trigger preprocessing
    expect(preprocessImage).not.toHaveBeenCalled();
  });
});
