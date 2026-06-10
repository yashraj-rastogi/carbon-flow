/**
 * @jest-environment node
 */
import { getAuthUser, generateToken } from '@/lib/auth';

describe('Auth Utilities', () => {
  describe('generateToken', () => {
    it('creates a valid Base64 token from user payload', () => {
      const token = generateToken({ id: '12345', username: 'testuser' });
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('encodes userId and username in the payload', () => {
      const token = generateToken({ id: 'abc123', username: 'john' });
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      expect(decoded.userId).toBe('abc123');
      expect(decoded.username).toBe('john');
    });

    it('produces different tokens for different users', () => {
      const token1 = generateToken({ id: '1', username: 'user1' });
      const token2 = generateToken({ id: '2', username: 'user2' });
      expect(token1).not.toBe(token2);
    });
  });

  describe('getAuthUser', () => {
    function createRequest(authHeader?: string): Request {
      const headers = new Headers();
      if (authHeader) {
        headers.set('Authorization', authHeader);
      }
      return new Request('http://localhost/api/test', { headers });
    }

    it('decodes a valid Bearer token correctly', () => {
      const token = generateToken({ id: 'user123', username: 'testpilot' });
      const request = createRequest(`Bearer ${token}`);
      const user = getAuthUser(request);
      expect(user).not.toBeNull();
      expect(user?.userId).toBe('user123');
      expect(user?.username).toBe('testpilot');
    });

    it('returns null when Authorization header is missing', () => {
      const request = createRequest();
      expect(getAuthUser(request)).toBeNull();
    });

    it('returns null when Authorization header is empty', () => {
      const request = createRequest('');
      expect(getAuthUser(request)).toBeNull();
    });

    it('returns null when token is not prefixed with Bearer', () => {
      const token = generateToken({ id: '1', username: 'user' });
      const request = createRequest(`Basic ${token}`);
      expect(getAuthUser(request)).toBeNull();
    });

    it('returns null for malformed Base64 token', () => {
      const request = createRequest('Bearer not-valid-base64!!!');
      expect(getAuthUser(request)).toBeNull();
    });

    it('returns null for valid Base64 but missing userId field', () => {
      const payload = Buffer.from(JSON.stringify({ username: 'test' })).toString('base64');
      const request = createRequest(`Bearer ${payload}`);
      expect(getAuthUser(request)).toBeNull();
    });

    it('returns null for valid Base64 but missing username field', () => {
      const payload = Buffer.from(JSON.stringify({ userId: '123' })).toString('base64');
      const request = createRequest(`Bearer ${payload}`);
      expect(getAuthUser(request)).toBeNull();
    });

    it('returns null for non-JSON Base64 content', () => {
      const payload = Buffer.from('this is not json').toString('base64');
      const request = createRequest(`Bearer ${payload}`);
      expect(getAuthUser(request)).toBeNull();
    });
  });
});
