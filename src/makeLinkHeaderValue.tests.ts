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

  o('Skips ignored/invalid and empty module tokens', () => {
    const modules: ParsedModules = [
      { name: 'Http404', invalid: true },
      'B',
      { name: '../EVIL', invalid: true },
      'A',
      { name: 'C', empty: true },
    ];
    o(makeLinkHeaderValue(cssFolderName, modules)).equals(
      '</css/v1/B.css>;rel=preload;as=style,</css/v1/A.css>;rel=preload;as=style'
    );
  });

  o('Returns undefined for empty or all-invalid token lists', () => {
    const emptyList: ParsedModules = [];
    const allInvalidOrEmpty: ParsedModules = [
      { name: 'Http404', invalid: true },
      { name: 'EmptyModule', empty: true },
    ];

    o(makeLinkHeaderValue(cssFolderName, emptyList)).equals(undefined);
    o(makeLinkHeaderValue(cssFolderName, allInvalidOrEmpty)).equals(undefined);
  });
});
