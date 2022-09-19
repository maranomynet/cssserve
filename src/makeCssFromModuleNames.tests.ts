import o from 'ospec';

import makeCssFromModuleNames from './makeCssFromModuleNames';
import { ParsedModules } from './types';

const outputA = `
@import "/css/v999/C.css";
@import "/css/v999/A.css";
@import "/css/v999/B.css";
`.trimStart();

const outputB = `
/* token "Http404" is invalid */
@import "/css/v999/C.css";
/* token "../EVIL" is invalid */
@import "/css/v999/D.css";
`.trimStart();

// ---------------------------------------------------------------------------

o.spec('makeCssFromModuleNames', () => {
  const cssFolderName = 'css/v999/';

  o('Makes a simple CSS file with @imports. (No sorting!)', () => {
    const modules: ParsedModules = ['C', 'A', 'B'];
    o(makeCssFromModuleNames(cssFolderName, modules)).equals(outputA);
  });

  o('Inserts comment-markers about ignored/invalid module tokens', () => {
    const modules: ParsedModules = [
      { name: 'Http404', invalid: true },
      'C',
      { name: '../EVIL', invalid: true },
      'D',
    ];
    o(makeCssFromModuleNames(cssFolderName, modules)).equals(outputB);
  });
});
