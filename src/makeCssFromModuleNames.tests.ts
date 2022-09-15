import o from 'ospec';

import makeCssFromModuleNames from './makeCssFromModuleNames';
import { ParsedModules } from './types';

const outputA = `
@import "/css/v1/C.css";
@import "/css/v1/A.css";
@import "/css/v1/B.css";
`.trimStart();

const outputB = `
/* token "Http404" ignored */
@import "/css/v1/C.css";
/* token "../EVIL" ignored */
@import "/css/v1/B.css";
`.trimStart();

// ---------------------------------------------------------------------------

o.spec('makeCssFromModuleNames', () => {
  const cssFolderName = 'css/v1/';

  o('Makes a simple CSS file with @imports. (No sorting!)', () => {
    const modules = ['C', 'A', 'B'];
    o(makeCssFromModuleNames(cssFolderName, modules)).equals(outputA);
  });

  o('Inserts comment-markers about ignored/invalid module tokens', () => {
    const modules: ParsedModules = [
      { ignored: 'Http404' },
      'C',
      { ignored: '../EVIL' },
      'B',
    ];
    o(makeCssFromModuleNames(cssFolderName, modules)).equals(outputB);
  });
});
