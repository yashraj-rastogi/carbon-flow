/* eslint-disable @typescript-eslint/no-explicit-any */
// Polyfill standard Web APIs in Jest VM sandbox by breaking out to the host context
// eslint-disable-next-line @typescript-eslint/no-require-imports
const hostGlobal = require('fs').readFileSync.constructor('return this')();
globalThis.Request = globalThis.Request || hostGlobal.Request;
globalThis.Response = globalThis.Response || hostGlobal.Response;
globalThis.Headers = globalThis.Headers || hostGlobal.Headers;
globalThis.fetch = globalThis.fetch || hostGlobal.fetch;
globalThis.TextEncoder = globalThis.TextEncoder || hostGlobal.TextEncoder;
globalThis.TextDecoder = globalThis.TextDecoder || hostGlobal.TextDecoder;
globalThis.TextEncoderStream = globalThis.TextEncoderStream || hostGlobal.TextEncoderStream;
globalThis.TextDecoderStream = globalThis.TextDecoderStream || hostGlobal.TextDecoderStream;

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
