import { describe, expect, test } from 'bun:test';

import { staticFolder } from '../../testing/cssserve-config.json';

import resolveCssVersionFolder from './resolveCssVersionFolder.js';

// ---------------------------------------------------------------------------

describe('resolveCssVersionFolder', () => {
  test('finds exact folderNames', () => {
    expect(resolveCssVersionFolder(staticFolder, 'dev')).toEqual('css/dev/');
    expect(resolveCssVersionFolder(staticFolder, 'v1.1')).toEqual('css/v1.1/');
  });
  test('finds highest point-version folder', () => {
    expect(resolveCssVersionFolder(staticFolder, 'v1')).toEqual('css/v1.10.10/');
    expect(resolveCssVersionFolder(staticFolder, 'v1.2')).toEqual('css/v1.2/');
    expect(resolveCssVersionFolder(staticFolder, 'v1.10')).toEqual('css/v1.10.10/');
    expect(resolveCssVersionFolder(staticFolder, 'v15')).toEqual('css/v15.1/');
  });
  test('returns `null` for missing/unpublished version', () => {
    expect(resolveCssVersionFolder(staticFolder, 'v1.4')).toBe(null);
  });
  test('returns `null` for undefined version', () => {
    expect(resolveCssVersionFolder(staticFolder, undefined)).toBe(null);
  });
  test('returns `null` for bonkers versions', () => {
    expect(resolveCssVersionFolder(staticFolder, 'bonkers')).toBe(null);
  });
  test('returns `null` for evil versions', () => {
    expect(resolveCssVersionFolder(staticFolder, '../css/dev')).toBe(null);
  });
});
