import { describe, expect, test } from 'bun:test';

import isSafeToken from './isSafeToken.js';

// ---------------------------------------------------------------------------

describe('iSafeToken', () => {
  test('Accepts simple tokens', () => {
    expect(isSafeToken('hello')).toBe(true);
    expect(isSafeToken('1.1')).toBe(true);
    expect(isSafeToken('foo-bar')).toBe(true);
    expect(isSafeToken('foo_bar')).toBe(true);
  });
  test('rejects evil tokens', () => {
    expect(isSafeToken('foo/bar')).toBe(false);
    expect(isSafeToken('foo/../bar')).toBe(false);
    expect(isSafeToken('..')).toBe(false);
  });
  test('accepts undefined/empty tokens', () => {
    expect(isSafeToken('')).toBe(true);
    expect(isSafeToken(undefined)).toBe(true);
  });
});
