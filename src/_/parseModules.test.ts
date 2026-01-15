import { describe, expect, test } from 'bun:test';

import cfg from '../../testing/cssserve-config.json' with { type: 'json' };

import parseModules from './parseModules.js';
import {
  NonExistentModuleError,
  ParsedModules,
  UnsafeModuleTokenError,
} from './types.js';

const defaultOpts = {
  cache: true,
  loudBadTokenErrors: false,
};

type Opts = Parameters<typeof parseModules>[2];

// ---------------------------------------------------------------------------

describe('parseModules', () => {
  const sourceFolder = `${cfg.staticFolder}css/dev/`;

  type TestDescr =
    | {
        input: Array<string>;
        expected: ParsedModules;
        opts?: Opts;
      }
    | {
        input: Array<string>;
        error: { notFound: string } | { invalid: string };
        opts?: Opts;
      };

  const tests: Record<string, TestDescr> = {
    'finds a basic module': {
      input: ['_basic'],
      expected: ['_basic'],
    },
    'sorts the module list': {
      input: ['Button', '_basic'],
      expected: ['_basic', 'Button'],
    },
    'finds depenencies': {
      input: ['Prompt'],
      expected: ['Button', 'Prompt'],
    },
    'finds dependencies recursively': {
      input: ['Wizard'],
      expected: ['Button', 'Prompt', 'Wizard'],
    },
    'deduplicates the list': {
      input: ['Button', 'Button'],
      expected: ['Button'],
    },
    'deduplicates from sub-dependencies': {
      input: ['Prompt', 'Button'],
      expected: ['Button', 'Prompt'],
    },
    'correctly merges duplicated sub-dependencies': {
      input: ['Prompt', 'Button', 'Search'],
      expected: ['Button', 'Prompt', 'Input', 'Search'],
    },
    'tolerates circular dependencies': {
      input: ['A', 'B'],
      expected: ['B', 'A'],
    },
    // ---------------------
    'suppresses empty module files': {
      input: ['EmptyModule'],
      expected: [{ name: 'EmptyModule', empty: true }],
    },
    'suppresses meta (@deps only) module files': {
      input: ['MetaModule', 'A'],
      expected: [
        'B',
        'A',
        'Button',
        'Prompt',
        'Input',
        'Search',
        { name: 'MetaModule', empty: true },
      ],
    },
    // ---------------------
    'Warns about broken top-level module tokens that match no CSS file': {
      input: ['Prompt', 'Button', 'Search', 'Http404'],
      expected: [
        'Button',
        { name: 'Http404', invalid: true },
        'Prompt',
        'Input',
        'Search',
      ],
    },
    'Optionally throws for broken top-level module tokens that match no CSS file': {
      input: ['Prompt', 'Button', 'Search', 'Http404'],
      error: { notFound: 'Http404' },
      opts: { loudBadTokenErrors: true },
    },
    'Throws for unsafe top-level module tokens': {
      input: ['Prompt', 'Button', 'Search', '/etc/evil/token'],
      error: { invalid: '/etc/evil/token' },
      opts: { loudBadTokenErrors: true },
    },
    'Throws for unsafe top-level module tokens regardless config.loadBadTokenErrors': {
      input: ['Prompt', 'Button', 'Search', '/etc/evil/token'],
      error: { invalid: '/etc/evil/token' },
      opts: { loudBadTokenErrors: false },
    },
    // NOTE: Don't bother users of cssBundler with the mistakes of the CSS author.
    'Broken /*!@deps*/ tokens in CSS files are silently ignored': {
      input: ['HasBrokenDependency'],
      expected: ['Button', { name: 'Http404', invalid: true }, 'HasBrokenDependency'],
    },
    // NOTE: Don't bother users of cssBundler with the mistakes of the CSS author.
    'Unsafe /*!@deps*/ tokens in CSS files are silently ignored': {
      input: ['HasUnsafeDependencies'],
      expected: [
        { name: '../../_EVÍL$_/Http404', invalid: true },
        { name: '../dev/Input', invalid: true },
        'Button',
        'HasUnsafeDependencies',
      ],
    },
  };

  Object.entries(tests).forEach(([name, testInfo]) => {
    test(name, () => {
      const modulesP = parseModules(
        testInfo.input,
        sourceFolder,
        testInfo.opts || defaultOpts
      );

      if ('expected' in testInfo) {
        expect(modulesP).resolves.toEqual(testInfo.expected);
      } else {
        modulesP
          .then((modules) => {
            // @ts-expect-error  (messaging the problem)
            expect(modules).toBe('should have cast an error');
          })
          .catch((err) => {
            if ('notFound' in testInfo.error) {
              expect(err).toBeInstanceOf(NonExistentModuleError);
              expect((err as NonExistentModuleError).moduleName).toBe(
                testInfo.error.notFound
              );
            } else {
              expect(err).toBeInstanceOf(UnsafeModuleTokenError);
              expect((err as UnsafeModuleTokenError).moduleName).toBe(
                testInfo.error.invalid
              );
            }
          });
      }
    });
  });
});
