/**
 * @jest-environment node
 */
import {
  createSuccessResponse,
  createErrorResponse,
  getErrorMessage,
  authenticateRequest,
  parseJsonBody,
  validateRequiredFields,
  sanitizeString,
} from '@/lib/api-utils';
import { getAuthUser } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
  getAuthUser: jest.fn(),
}));

describe('API Utilities', () => {
  describe('createSuccessResponse', () => {
    it('returns 200 with success:true by default', async () => {
      const response = createSuccessResponse({ data: 'test' });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data).toBe('test');
    });

    it('accepts custom status code', async () => {
      const response = createSuccessResponse({ msg: 'created' }, 201);
      expect(response.status).toBe(201);
    });
  });

  describe('createErrorResponse', () => {
    it('returns 500 with success:false by default', async () => {
      const response = createErrorResponse('Something broke');
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('Something broke');
    });

    it('accepts custom status code', async () => {
      const response = createErrorResponse('Not found', 404);
      expect(response.status).toBe(404);
    });
  });

  describe('getErrorMessage', () => {
    it('extracts message from Error instances', () => {
      expect(getErrorMessage(new Error('test error'))).toBe('test error');
    });

    it('returns fallback for non-Error values', () => {
      expect(getErrorMessage('string error')).toBe('Internal Server Error');
      expect(getErrorMessage(42)).toBe('Internal Server Error');
      expect(getErrorMessage(null)).toBe('Internal Server Error');
    });
  });

  describe('authenticateRequest', () => {
    it('returns user and null error when authenticated', () => {
      const mockUser = { userId: 'user123', username: 'test' };
      (getAuthUser as jest.Mock).mockReturnValue(mockUser);
      const request = new Request('http://localhost/test');

      const [user, error] = authenticateRequest(request);
      expect(user).toEqual(mockUser);
      expect(error).toBeNull();
    });

    it('returns null user and 401 response when not authenticated', async () => {
      (getAuthUser as jest.Mock).mockReturnValue(null);
      const request = new Request('http://localhost/test');

      const [user, error] = authenticateRequest(request);
      expect(user).toBeNull();
      expect(error).not.toBeNull();
      expect(error!.status).toBe(401);
    });
  });

  describe('parseJsonBody', () => {
    it('parses valid JSON body', async () => {
      const request = new Request('http://localhost/test', {
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
      });
      const body = await parseJsonBody(request);
      expect(body.key).toBe('value');
    });

    it('returns empty object for invalid JSON', async () => {
      const request = new Request('http://localhost/test', {
        method: 'POST',
        body: 'not-json',
      });
      const body = await parseJsonBody(request);
      expect(body).toEqual({});
    });
  });

  describe('validateRequiredFields', () => {
    it('returns null when all fields present', () => {
      const result = validateRequiredFields({ a: 1, b: 'test' }, ['a', 'b']);
      expect(result).toBeNull();
    });

    it('returns error message for missing fields', () => {
      const result = validateRequiredFields({ a: 1 }, ['a', 'b']);
      expect(result).toBe('b is required');
    });

    it('returns error for empty string fields', () => {
      const result = validateRequiredFields({ a: '' }, ['a']);
      expect(result).toBe('a is required');
    });

    it('returns error for null fields', () => {
      const result = validateRequiredFields({ a: null }, ['a']);
      expect(result).toBe('a is required');
    });
  });

  describe('sanitizeString', () => {
    it('strips HTML tags', () => {
      expect(sanitizeString('hello<script>alert("xss")</script>world')).toBe('helloalert("xss")world');
    });

    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('handles clean input unchanged', () => {
      expect(sanitizeString('clean-input')).toBe('clean-input');
    });
  });
});
