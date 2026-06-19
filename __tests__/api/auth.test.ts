/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/route';
import { User, HabitState } from '@/lib/models';
import { connectToDatabase } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/models', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const mockUser = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: { toString: () => 'mock_user_id' },
    save: mockSave,
  }));
  (mockUser as any).findOne = jest.fn();

  const mockHabitState = jest.fn().mockImplementation((data) => ({
    ...data,
    save: mockSave,
  }));
  (mockHabitState as any).findOne = jest.fn();

  return {
    User: mockUser,
    HabitState: mockHabitState,
  };
});

describe('Auth API Endpoint (/api/auth)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if username is missing', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toBe('username is required');
  });

  it('returns 400 if username is too long', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'a'.repeat(51) }), // MAX_USERNAME_LENGTH is 50
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toContain('username must be at most 50 characters');
  });

  it('returns 400 if username contains invalid characters', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'user@hack!' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toContain('Username may only contain letters, numbers, underscores, and hyphens');
  });

  it('returns 400 if username contains spaces', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'user name' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toContain('Username may only contain letters, numbers, underscores, and hyphens');
  });

  it('registers a new user successfully if user does not exist', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'newuser', action: 'register' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.token).toBeTruthy();
    expect(json.user.username).toBe('newuser');
    expect(User).toHaveBeenCalled();
    expect(HabitState).toHaveBeenCalled();
  });

  it('returns 400 for registration if user already exists', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'existing_id',
      username: 'existinguser',
    });

    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'existinguser', action: 'register' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toBe('User already exists');
  });

  it('logs in an existing user', async () => {
    const mockDbUser = {
      _id: { toString: () => 'existing_id' },
      username: 'existinguser',
      email: 'existinguser@example.com',
    };
    (User.findOne as jest.Mock).mockResolvedValue(mockDbUser);

    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'existinguser', action: 'login' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.token).toBeTruthy();
    expect(json.user.id).toBe('existing_id');
  });

  it('auto-creates user on login if they do not exist', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'brandnewuser', action: 'login' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.token).toBeTruthy();
    expect(json.user.username).toBe('brandnewuser');
    expect(User).toHaveBeenCalled();
    expect(HabitState).toHaveBeenCalled();
  });

  it('returns 500 on database error', async () => {
    (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('DB connection failed'));

    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'user', action: 'login' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.error).toBe('DB connection failed');
  });

  it('accepts usernames with hyphens and underscores', async () => {
    (connectToDatabase as jest.Mock).mockResolvedValue(true);
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'my-user_name123', action: 'register' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.user.username).toBe('my-user_name123');
  });
});

