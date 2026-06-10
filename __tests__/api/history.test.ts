/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/history/route';
import { CarbonLog, HabitState } from '@/lib/models';
import { getAuthUser } from '@/lib/auth';
import { processOmissionsIfOverdue, updateHabitState } from '@/lib/mdp';
import { connectToDatabase } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn(),
}));

jest.mock('@/lib/mdp', () => ({
  processOmissionsIfOverdue: jest.fn(),
  updateHabitState: jest.fn(),
}));

jest.mock('@/lib/models', () => {
  const mockFindResult = {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  };
  return {
    CarbonLog: {
      find: jest.fn().mockReturnValue(mockFindResult),
    },
    HabitState: {
      findOne: jest.fn(),
    },
  };
});

describe('History API Endpoint (/api/history)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET Handler', () => {
    it('returns 401 if unauthorized', async () => {
      (getAuthUser as jest.Mock).mockReturnValue(null);
      const request = new Request('http://localhost/api/history');

      const response = await GET(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('returns history logs, habitState, and metrics successfully', async () => {
      (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123', username: 'testuser' });
      (processOmissionsIfOverdue as jest.Mock).mockResolvedValue(null);

      const mockLogs = [
        { co2EmissionsKg: 10, type: 'electricity' },
        { co2EmissionsKg: 5, type: 'gas' },
      ];
      const mockFindResult = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockLogs),
      };
      (CarbonLog.find as jest.Mock).mockReturnValue(mockFindResult);
      (HabitState.findOne as jest.Mock).mockResolvedValue({ habitStrength: 7 });

      const request = new Request('http://localhost/api/history');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.logs).toHaveLength(2);
      expect(json.habitState.habitStrength).toBe(7);
      expect(json.metrics.totalEmissions).toBe(15);
      expect(json.metrics.categoryEmissions.electricity).toBe(10);
      expect(json.metrics.categoryEmissions.gas).toBe(5);
    });

    it('applies overdue omissions if detected', async () => {
      (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123' });
      (processOmissionsIfOverdue as jest.Mock).mockResolvedValue({
        appliedOmissionsCount: 1,
        currentStrength: 3,
      });

      const mockFindResult = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      (CarbonLog.find as jest.Mock).mockReturnValue(mockFindResult);
      (HabitState.findOne as jest.Mock).mockResolvedValue({ habitStrength: 3 });

      const request = new Request('http://localhost/api/history');
      await GET(request);

      expect(processOmissionsIfOverdue).toHaveBeenCalledWith('user123');
    });
  });

  describe('POST Handler', () => {
    it('returns 401 if unauthorized', async () => {
      (getAuthUser as jest.Mock).mockReturnValue(null);
      const request = new Request('http://localhost/api/history', { method: 'POST' });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('returns 400 for invalid action', async () => {
      (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123' });
      const request = new Request('http://localhost/api/history', {
        method: 'POST',
        body: JSON.stringify({ action: 'invalid' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Invalid manual action');
    });

    it('triggers manual omission successfully', async () => {
      (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123' });
      (updateHabitState as jest.Mock).mockResolvedValue({
        previousStrength: 5,
        currentStrength: 3,
        reward: -5,
      });

      const request = new Request('http://localhost/api/history', {
        method: 'POST',
        body: JSON.stringify({ action: 'omission' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.mdp.currentStrength).toBe(3);
      expect(updateHabitState).toHaveBeenCalledWith('user123', 'omission');
    });
  });
});
