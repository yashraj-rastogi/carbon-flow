import { validateSchema } from '@/lib/validation';

describe('validateSchema', () => {
  it('validates a correct payload', () => {
    const payload = { username: 'testuser', age: 30 };
    const result = validateSchema(payload, {
      username: { type: 'string', required: true },
      age: { type: 'number' },
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual(payload);
  });

  it('catches missing required fields', () => {
    const payload = { age: 30 };
    const result = validateSchema(payload, {
      username: { type: 'string', required: true },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('is required');
  });

  it('catches type mismatches', () => {
    const payload = { username: 123 };
    const result = validateSchema(payload, {
      username: { type: 'string', required: true },
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('must be of type string');
  });

  it('validates string length and pattern', () => {
    const result1 = validateSchema({ username: 'a' }, {
      username: { type: 'string', minLength: 3 },
    });
    expect(result1.success).toBe(false);

    const result2 = validateSchema({ username: 'abcdef' }, {
      username: { type: 'string', maxLength: 5 },
    });
    expect(result2.success).toBe(false);

    const result3 = validateSchema({ username: 'test@user' }, {
      username: { type: 'string', pattern: /^[a-z]+$/ },
    });
    expect(result3.success).toBe(false);
  });

  it('validates enums', () => {
    const schema = { action: { type: 'enum', enumValues: ['login', 'register'] } } as any;
    
    expect(validateSchema({ action: 'login' }, schema).success).toBe(true);
    expect(validateSchema({ action: 'logout' }, schema).success).toBe(false);
  });

  it('rejects non-object inputs', () => {
    expect(validateSchema(null, {}).success).toBe(false);
    expect(validateSchema('string', {}).success).toBe(false);
  });
});
