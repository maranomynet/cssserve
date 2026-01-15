import { describe, expect, test } from 'bun:test';

import parseDepsFromCSS from './parseDepsFromCSS.js';

// ---------------------------------------------------------------------------

describe('parseDepsFromCSS', () => {
  const tests: Record<
    string,
    {
      css: string;
      expects: Array<string>;
      expects_hasCSS?: false;
    }
  > = {
    'Declaration with each module on its own line': {
      css: '/*!@deps\n\tFoo\tBar\n*/body{color:red}',
      expects: ['Foo', 'Bar'],
    },
    'Declaration w. mixture of spaces, commas, semi-commas and newlines': {
      css: '/*!@deps Foo\nBar,\n \tBaz Smu;Ble \n */body{color:red}',
      expects: ['Foo', 'Bar', 'Baz', 'Smu', 'Ble'],
    },
    'Allows space before "@deps"': {
      css: '/*! @deps \n\n\tFoo\tBar\n*/body{color:red}',
      expects: ['Foo', 'Bar'],
    },
    'Is OK with there not being any actual CSS': {
      css: '\n\n/*!@deps\n\tFoo\tBar\n*/\n\nbody{color:red}',
      expects: ['Foo', 'Bar'],
    },
    'Duplicate module names are purposefully allowed': {
      css: '/*!@deps Foo,Bar,Foo,Foo,Bar*/body{color:red}',
      expects: ['Foo', 'Bar', 'Foo', 'Foo', 'Bar'],
    },
    // ------------------------
    'Multiple declarations are supported': {
      css: '/*!@deps Foo,Bar,Foo*/\n\n/*!@deps Smu, Foo */\nbody{color:red}',
      expects: ['Foo', 'Bar', 'Foo', 'Smu', 'Foo'],
    },
    'Multiple declarations may have CSS between them': {
      css: '/*!@deps Foo,Bar*/\nbody{color:blue;}\n/*!@deps Smu,Baz */\nbody{color:red}',
      expects: ['Foo', 'Bar', 'Smu', 'Baz'],
    },

    // NOTE: The parser views CSS files as a trusted source.
    'Is purposefully agnostic about evil module names': {
      css: '/*!@deps Fo/../o, ../Bar ${EVIL} */body{color:red}',
      expects: ['Fo/../o', '../Bar', '${EVIL}'],
    },
    // ------------------------
    'Other /*! comments may precede declaration': {
      css: '/*! @licence Whatever */\n/*!@deps\n\tFoo\tBar\n*/body{color:red}',
      expects: ['Foo', 'Bar'],
    },
    'CSS rules may precede the declaration': {
      css: 'body{color:red}/*! @licence Whatever */\n/*!@deps\n\tFoo\tBar\n*/',
      expects: ['Foo', 'Bar'],
    },
    // ------------------------
    'Invalid @deps markers are ignored': {
      css: '/*!@ deps\n\tFoo\tBar\n*/body{color:red}',
      expects: [],
    },
    'Invalid @deps markers are ignored 2': {
      css: '/*!@Deps\n\tFoo\tBar\n*/body{color:red}',
      expects: [],
    },
    // ------------------------
    'No deps is ok': {
      css: 'body{color:red}',
      expects: [],
    },
    'Empty "@deps" is ok': {
      css: '/*! @deps */body{color:red}',
      expects: [],
    },
    // ------------------------
    'No content is detected': {
      css: '\n\n  \n ',
      expects: [],
      expects_hasCSS: false,
    },
    'No significant content is detected': {
      css: '\n /*! @deps\n*/\n\n  \n ',
      expects: [],
      expects_hasCSS: false,
    },
    'No significant non-@deps content is detected': {
      css: '/*! @deps Button */\n \n/* other *//* comments\n */\n',
      expects: ['Button'],
      expects_hasCSS: false,
    },
    'Allows `// comments` inside @deps block': {
      css: '/*! @deps // comment\nButton // some // comments\n Link\n// comment */body{color:red}',
      expects: ['Button', 'Link'],
    },
  };

  Object.entries(tests).forEach(([name, testInfo]) => {
    test(name, () => {
      const output = parseDepsFromCSS(testInfo.css);
      expect(output.slice(0)).toEqual(testInfo.expects);
      expect(output.hasCSS).toBe(testInfo.expects_hasCSS !== false);
    });
  });
});
