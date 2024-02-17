import { describe, expect, test } from 'bun:test';

import redirectsFromFile from '../testing/redirectsFile.json';
import redirectsFromFile2 from '../testing/redirectsFile2.json';

import { parseRedirects } from './parseRedirects.js';

const redirects1 = {
  '/foo': '/bar',
  '/foo2': '/bar#30',
  '/foo3': '/bar#!',
};
const redirectsFile = 'testing/redirectsFile.json';
const redirectsFile2 = 'testing/redirectsFile2.json';

const redirectsFile_notThere = 'testing/non_existing.file';
const redirectsFile_notJSON = 'testing/public/index.html';
const redirectsFile_notMap = 'testing/cssserve-config.json';

describe('parseRedirects', () => {
  test('works', () => {
    expect(parseRedirects(undefined)).toBeUndefined(); // default case
    expect(parseRedirects(redirects1)).toEqual(redirects1); // redirects map
    expect(parseRedirects(undefined, redirectsFile)).toEqual(redirectsFromFile); // redirectsFile string
    expect(parseRedirects(undefined, '')).toBeUndefined(); // redirectsFile empty string
    expect(parseRedirects(undefined, [redirectsFile])).toEqual(redirectsFromFile); // redirectsFile array
    expect(parseRedirects(undefined, [redirectsFile, redirectsFile2])).toEqual({
      ...redirectsFromFile,
      ...redirectsFromFile2,
    }); // redirectsFile array
    expect(parseRedirects(undefined, [])).toBeUndefined(); // redirectsFile empty array
    expect(parseRedirects(undefined, [redirectsFile, '', ''])).toEqual(redirectsFromFile); // redirectsFile sparse array
  });

  test('merges contents of redirectFile into redirects', () => {
    expect(parseRedirects(redirects1, redirectsFile)).toEqual({
      ...redirects1,
      ...redirectsFromFile,
    });
    expect(parseRedirects(redirects1, [redirectsFile, redirectsFile2])).toEqual({
      ...redirects1,
      ...redirectsFromFile,
      ...redirectsFromFile2,
    });
  });

  test('throws on wonky input', () => {
    expect(() => {
      // @ts-expect-error  (testing bad input)
      parseRedirects('foo');
    }).toThrow(Error); // non-map redirects (string)

    expect(() => {
      // @ts-expect-error  (testing bad input)
      parseRedirects('');
    }).toThrow(Error); // non-map redirects (empty string)

    expect(() => {
      // @ts-expect-error  (testing bad input)
      parseRedirects(['foo']);
    }).toThrow(Error); // non-map redirects (array)

    expect(() => {
      // @ts-expect-error  (testing bad input)
      parseRedirects(redirects1, { '/bogus': 'value' });
    }).toThrow(Error); // redirectsFile must be string

    expect(() => parseRedirects(redirects1, redirectsFile_notThere)).toThrow(Error); // non-existent redirectsFile

    expect(() => parseRedirects(redirects1, redirectsFile_notJSON)).toThrow(Error); // non-JSON redirectsFile

    expect(() => parseRedirects(redirects1, redirectsFile_notMap)).toThrow(Error); // non-map redirectsFile
  });
});
