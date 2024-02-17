import { describe, expect, test } from 'bun:test';

import makeCssFromModuleNames from './makeCssFromModuleNames.js';
import { ParsedModules } from './types.js';

const outputA = `
@import "/css/v999/C.css";
@import "/css/v999/A.css";
@import "/css/v999/B.css";
`.trimStart();

const outputB = `
/* Uknown token: "Http404" */
@import "/css/v999/C.css";
/* Uknown token: "../EVIL" */
@import "/css/v999/A.css";
/* Token "D" found, but contains no CSS */
`.trimStart();

// ---------------------------------------------------------------------------

describe('makeCssFromModuleNames', () => {
  const cssFolderName = 'css/v999/';

  test('Makes a simple CSS file with @imports. (No sorting!)', () => {
    const modules: ParsedModules = ['C', 'A', 'B'];
    expect(makeCssFromModuleNames(cssFolderName, modules)).toBe(outputA);
  });

  test('Inserts comment-markers about ignored/invalid module tokens', () => {
    const modules: ParsedModules = [
      { name: 'Http404', invalid: true },
      'C',
      { name: '../EVIL', invalid: true },
      'A',
      { name: 'D', empty: true },
    ];
    expect(makeCssFromModuleNames(cssFolderName, modules)).toBe(outputB);
  });
});
