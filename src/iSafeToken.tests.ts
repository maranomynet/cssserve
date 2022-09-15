import o from 'ospec';

import isSafeToken from './isSafeToken';

// ---------------------------------------------------------------------------

o.spec('iSafeToken', () => {
  o('Accepts simple tokens', () => {
    o(isSafeToken('hello')).equals(true);
    o(isSafeToken('1.1')).equals(true);
    o(isSafeToken('foo-bar')).equals(true);
    o(isSafeToken('foo_bar')).equals(true);
  });
  o('rejects evil tokens', () => {
    o(isSafeToken('foo/bar')).equals(false);
    o(isSafeToken('foo/../bar')).equals(false);
    o(isSafeToken('..')).equals(false);
  });
  o('accepts undefined/empty tokens', () => {
    o(isSafeToken('')).equals(true);
    o(isSafeToken(undefined)).equals(true);
  });
});
