/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/actions/route';
import { Action } from '@/lib/models';
import { getAuthUser } from '@/lib/auth';
import { updateHabitState } from '@/lib/mdp';

jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn(),
}));

jest.mock('@/lib/mdp', () => ({
  updateHabitState: jest.fn(),
}));

jest.mock('@/lib/models', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const mockCarbonLog = jest.fn().mockImplementation((data: Record<string, unknown>) => ({
    ...data,
    save: mockSave,
  }));

  return {
    Action: {
      find: jest.fn(),
      insertMany: jest.fn(),
      findById: jest.fn(),
    },
    CarbonLog: mockCarbonLog,
  };
});

describe('Actions API Endpoint (/api/actions)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET Handler', () => {
    it('returns seeded actions list', async () => {
      const mockActions = [{ name: 'Test Action', category: 'gas', impactKg: -1.2 }];
      (Action.find as jest.Mock).mockResolvedValueOnce(mockActions);

      const response = await GET();

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.actions).toHaveLength(1);
      expect(json.actions[0].name).toBe('Test Action');
    });

    it('auto-seeds if database is empty', async () => {
      (Action.find as jest.Mock)
        .mockResolvedValueOnce([]) // Empty first find
        .mockResolvedValueOnce([{ name: 'Seeded Action' }]); // Return seeded after insert

      const response = await GET();

      expect(response.status).toBe(200);
      expect(Action.insertMany).toHaveBeenCalled();
      const json = await response.json();
      expect(json.actions[0].name).toBe('Seeded Action');
    });
  });

  describe('POST Handler', () => {
    it('returns 401 if unauthorized', async () => {
      (getAuthUser as jest.Mock).mockReturnValue(null);
      const request = new Request('http://localhost/api/actions', { method: 'POST' });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('returns 400 if actionId is missing', async () => {
      (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123' });
      const request = new Request('http://localhost/api/actions', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Action ID is required');
    });

    it('returns 404 if action not found', async () => {
      (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123' });
      (Action.findById as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost/api/actions', {
        method: 'POST',
        body: JSON.stringify({ actionId: 'invalid_id' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Action not found');
    });

    it('logs action and updates habit state successfully', async () => {
      (getAuthUser as jest.Mock).mockReturnValue({ userId: 'user123' });
      const mockAction = {
        _id: 'action123',
        name: 'Test Action',
        category: 'gas',
        description: 'Mock action desc',
        impactKg: -1.2,
      };
      (Action.findById as jest.Mock).mockResolvedValue(mockAction);
      (updateHabitState as jest.Mock).mockResolvedValue({
        previousStrength: 5,
        currentStrength: 6,
        reward: 19.0,
      });

      const request = new Request('http://localhost/api/actions', {
        method: 'POST',
        body: JSON.stringify({ actionId: 'action123' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.carbonDeltaKg).toBe(-1.2);
      expect(json.mdp.currentStrength).toBe(6);
      expect(updateHabitState).toHaveBeenCalledWith('user123', 'log', -1.2);
    });
  });
});
