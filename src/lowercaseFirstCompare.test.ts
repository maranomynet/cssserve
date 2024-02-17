import { describe, expect, test } from 'bun:test';

import lowercaseFirstCompare from './lowercaseFirstCompare.js';

// ---------------------------------------------------------------------------

describe('lowercaseFirstCompare', () => {
  test('sorts alphabetically first, then by case', () => {
    expect(['C', 'A', '_B'].sort(lowercaseFirstCompare)).toEqual(['_B', 'A', 'C']);
    expect(['aa', 'ab', 'Ab'].sort(lowercaseFirstCompare)).toEqual(['aa', 'Ab', 'ab']);
    expect(['B', 'a', 'c', 'D'].sort(lowercaseFirstCompare)).toEqual([
      'a',
      'B',
      'c',
      'D',
    ]);
  });
});
