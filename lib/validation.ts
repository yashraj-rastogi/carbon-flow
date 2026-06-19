/**
 * Lightweight runtime validation utility.
 * Avoids heavy external dependencies like Zod while providing similar API
 * for validating incoming JSON bodies.
 *
 * @module lib/validation
 */

export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'enum';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    enumValues?: string[];
  };
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates a raw object against a schema definition.
 *
 * @param data - The raw input data to validate
 * @param schema - The schema definition
 * @returns ValidationResult with either the typed data or an error message
 */
export function validateSchema<T>(data: unknown, schema: ValidationSchema): ValidationResult<T> {
  if (typeof data !== 'object' || data === null) {
    return { success: false, error: 'Input must be a JSON object' };
  }

  const record = data as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, rules] of Object.entries(schema)) {
    const value = record[key];

    if (value === undefined || value === null || value === '') {
      if (rules.required) {
        return { success: false, error: `${key} is required` };
      }
      continue;
    }

    if (typeof value !== rules.type && rules.type !== 'enum') {
      return { success: false, error: `${key} must be of type ${rules.type}` };
    }

    if (rules.type === 'string') {
      const strVal = value as string;
      if (rules.minLength !== undefined && strVal.length < rules.minLength) {
        return { success: false, error: `${key} must be at least ${rules.minLength} characters` };
      }
      if (rules.maxLength !== undefined && strVal.length > rules.maxLength) {
        return { success: false, error: `${key} must be at most ${rules.maxLength} characters` };
      }
      if (rules.pattern && !rules.pattern.test(strVal)) {
        return { success: false, error: `${key} format is invalid` };
      }
    }

    if (rules.type === 'enum') {
      if (!rules.enumValues?.includes(value as string)) {
        return { success: false, error: `${key} must be one of: ${rules.enumValues?.join(', ')}` };
      }
    }

    result[key] = value;
  }

  return { success: true, data: result as unknown as T };
}
