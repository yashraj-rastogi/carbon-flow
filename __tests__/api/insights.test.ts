import { GET } from '@/app/api/insights/route';
import { connectToDatabase } from '@/lib/db';
import { authenticateRequest } from '@/lib/api-utils';
import { extractWithCascade } from '@/lib/gemini';

jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(),
}));

jest.mock('@/lib/api-utils', () => ({
  authenticateRequest: jest.fn(),
  createSuccessResponse: jest.fn((data) => ({ status: 200, json: () => data })),
  createErrorResponse: jest.fn((msg, status) => ({ status, json: () => ({ error: msg }) })),
  getErrorMessage: jest.fn((err) => err.message),
}));

jest.mock('@/lib/gemini', () => ({
  extractWithCascade: jest.fn(),
}));

jest.mock('@/lib/models', () => ({
  CarbonLog: {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([
      { dateLogged: new Date(), type: 'electricity', co2EmissionsKg: 10, rawText: 'Test' }
    ]),
  },
}));

describe('GET /api/insights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if unauthorized', async () => {
    (authenticateRequest as jest.Mock).mockReturnValue([null, { status: 401 }]);
    
    const request = new Request('http://localhost/api/insights');
    const response = await GET(request);
    
    expect(response).toEqual({ status: 401 });
  });

  it('generates insights successfully', async () => {
    (authenticateRequest as jest.Mock).mockReturnValue([{ userId: 'test_user_123' }, null]);
    (extractWithCascade as jest.Mock).mockResolvedValue({
      data: {
        insights: [
          { title: 'Insight 1', description: 'Test 1', estimatedSavingsKg: -5 }
        ]
      }
    });

    const request = new Request('http://localhost/api/insights', {
      headers: { Authorization: 'Bearer token' }
    });
    
    const response = await GET(request) as any;
    const data = response.json();
    
    expect(connectToDatabase).toHaveBeenCalled();
    expect(extractWithCascade).toHaveBeenCalled();
    expect(data.insights).toHaveLength(1);
    expect(data.insights[0].title).toBe('Insight 1');
  });

  it('returns default message if no logs are found', async () => {
    (authenticateRequest as jest.Mock).mockReturnValue([{ userId: 'test_user_123' }, null]);
    const { CarbonLog } = require('@/lib/models');
    CarbonLog.lean.mockResolvedValueOnce([]);

    const request = new Request('http://localhost/api/insights');
    const response = await GET(request) as any;
    const data = response.json();

    expect(data.insights[0].title).toBe('Start Logging!');
  });
});
