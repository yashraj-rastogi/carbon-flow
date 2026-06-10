import '@testing-library/jest-dom';
import * as matchersNamespace from '@testing-library/jest-dom/matchers';
import { expect } from '@jest/globals';

const matchers = { ...matchersNamespace } as any;
if (matchers.default) {
  delete matchers.default;
}

// Extend Jest's global expect
expect.extend(matchers);

// Extend the ambient global expect as well, if it exists
if (typeof (globalThis as any).expect !== 'undefined') {
  (globalThis as any).expect.extend(matchers);
}
if (typeof (global as any).expect !== 'undefined') {
  (global as any).expect.extend(matchers);
}
