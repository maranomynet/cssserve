import { describe, expect, test } from 'bun:test';

import makeLinkHeaderValue from './makeLinkHeaderValue.js';
import { ParsedModules } from './types.js';

// ---------------------------------------------------------------------------

describe('makeLinkHeaderValue', () => {
  const cssFolderName = 'css/v1/';
  test('Makes Link HTTP header value list. (No sorting!)', () => {
    const modules = ['B', 'A'];
    expect(makeLinkHeaderValue(cssFolderName, modules)).toBe(
      '</css/v1/B.css>;rel=preload;as=style,</css/v1/A.css>;rel=preload;as=style'
    );
  });

  test('Skips ignored/invalid and empty module tokens', () => {
    const modules: ParsedModules = [
      { name: 'Http404', invalid: true },
      'B',
      { name: '../EVIL', invalid: true },
      'A',
      { name: 'C', empty: true },
    ];
    expect(makeLinkHeaderValue(cssFolderName, modules)).toBe(
      '</css/v1/B.css>;rel=preload;as=style,</css/v1/A.css>;rel=preload;as=style'
    );
  });

  test('Returns undefined for empty or all-invalid token lists', () => {
    const emptyList: ParsedModules = [];
    const allInvalidOrEmpty: ParsedModules = [
      { name: 'Http404', invalid: true },
      { name: 'EmptyModule', empty: true },
    ];

    expect(makeLinkHeaderValue(cssFolderName, emptyList)).toBeUndefined();
    expect(makeLinkHeaderValue(cssFolderName, allInvalidOrEmpty)).toBeUndefined();
  });
});
