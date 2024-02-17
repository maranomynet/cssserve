import { describe, expect, test } from 'bun:test';

import getModuleListFromQuery from './getModuleListFromQuery.js';

// ---------------------------------------------------------------------------

describe('getModuleListFromQuery', () => {
  const empty: Array<string> = [];
  test('finds the m param and splits it on commas, and sorts the list', () => {
    // basic single token
    expect(getModuleListFromQuery({ m: 'Module' })).toEqual(['Module']);
    // Splits on commas
    expect(getModuleListFromQuery({ m: 'A,B,C' })).toEqual(['A', 'B', 'C']);
    // Sorting
    expect(getModuleListFromQuery({ m: 'C,_B,A' })).toEqual(['_B', 'A', 'C']);
  });

  test('Accepts params with spaces and invalid tokens', () => {
    // Evil/unsafe module token
    expect(getModuleListFromQuery({ m: '../A, ,' })).toEqual(['../A']);
    // Spaces are not trimmed
    expect(getModuleListFromQuery({ m: 'A ,B, C,,' })).toEqual(['A', 'B', 'C']);
    // Unknown tokens
    expect(getModuleListFromQuery({ m: 'Halló,Jón' })).toEqual(['Halló', 'Jón']);
  });

  test('Ignores missing, or empty m param(s)', () => {
    expect(getModuleListFromQuery({})).toEqual(empty);
    expect(getModuleListFromQuery({ m: '' })).toEqual(empty);
    expect(getModuleListFromQuery({ m: ', ,  ,\n, ,\t' })).toEqual(empty);
    expect(getModuleListFromQuery({ m: ['', ''] })).toEqual(empty);
  });
});
