import o from 'ospec';

import makeLinkHeaderValue from './makeLinkHeaderValue';
import { ParsedModules } from './types';

// ---------------------------------------------------------------------------

o.spec('makeLinkHeaderValue', () => {
  const cssFolderName = 'css/v1/';
  o('Makes Link HTTP header value list. (No sorting!)', () => {
    const modules = ['B', 'A'];
    o(makeLinkHeaderValue(cssFolderName, modules)).equals(
      '</css/v1/B.css>;rel=preload;as=style,</css/v1/A.css>;rel=preload;as=style'
    );
  });

  o('Skips ignored/invalid module tokens', () => {
    const modules: ParsedModules = [
      { ignored: 'Http404' },
      'B',
      { ignored: '../EVIL' },
      'A',
    ];
    o(makeLinkHeaderValue(cssFolderName, modules)).equals(
      '</css/v1/B.css>;rel=preload;as=style,</css/v1/A.css>;rel=preload;as=style'
    );
  });

  o('Returns undefined for empty or all-invalid token lists', () => {
    const emptyList: ParsedModules = [];
    const allInvalid: ParsedModules = [{ ignored: 'Http404' }];

    o(makeLinkHeaderValue(cssFolderName, emptyList)).equals(undefined);
    o(makeLinkHeaderValue(cssFolderName, allInvalid)).equals(undefined);
  });
});
