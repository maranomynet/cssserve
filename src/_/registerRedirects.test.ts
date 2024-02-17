import { describe, expect, test } from 'bun:test';

import config from './config.js';
import { _normalizeRedirects, MIN_TTL } from './registerRedirects.js';

const status = 307;
const ttl = config.ttl_static;

describe('_normalizeRedirects', () => {
  test('works', () => {
    expect(_normalizeRedirects(undefined)).toBeUndefined();

    expect(
      _normalizeRedirects({
        '/foo': '/bar',
        '/foo2': '/bar2',
        '/foo3': 'https://www.external.com/bar3',
      })
    ).toEqual({
      '/foo': { target: '/bar', status, ttl },
      '/foo2': { target: '/bar2', status, ttl },
      '/foo3': { target: 'https://www.external.com/bar3', status, ttl },
    });
  });

  test('makes trailing slashes optional', () => {
    expect(
      _normalizeRedirects({
        '/foo/': '/bar',
      })
    ).toEqual({
      '/foo/': { target: '/bar', status, ttl },
      '/foo': { target: '/bar', status, ttl },
    });

    expect(
      _normalizeRedirects({
        '/foo/': '/bar',
        '/foo': '/barbar',
      })
    ).toEqual({
      '/foo/': { target: '/bar', status, ttl },
      '/foo': { target: '/barbar', status, ttl },
    }); // respects existing non-slash redirects

    expect(
      _normalizeRedirects({
        '/foo': '/barbar',
        '/foo/': '/bar',
      })
    ).toEqual({
      '/foo/': { target: '/bar', status, ttl },
      '/foo': { target: '/barbar', status, ttl },
    }); // respects existing non-slash redirects regardless of declaration order
  });

  test('parses custom ttl from target "#anchor"', () => {
    expect(
      _normalizeRedirects({
        '/foo': '/bar#666',
        '/foo2': 'https://www.external.com/bar3#99',
      })
    ).toEqual({
      '/foo': { target: '/bar', status, ttl: 666 },
      '/foo2': { target: 'https://www.external.com/bar3', status, ttl: 99 },
    });

    expect(_normalizeRedirects({ '/foo': '/bar#666.6' })).toEqual({
      '/foo': { target: '/bar', status, ttl: 667 },
    }); // rounds floats

    expect(_normalizeRedirects({ '/foo': '/bar#1' })).toEqual({
      '/foo': { target: '/bar', status, ttl: MIN_TTL },
    }); // minimum ttl is ${MIN_TTL} seconds

    expect(_normalizeRedirects({ '/foo': '/bar#-999.0' })).toEqual({
      '/foo': { target: '/bar', status, ttl: MIN_TTL },
    }); // Negative ttl is bounded at ${MIN_TTL} seconds

    expect(_normalizeRedirects({ '/foo': '/bar#999999999999' })).toEqual({
      '/foo': { target: '/bar', status, ttl: 999999999999 },
    }); // Ttl has no upper bound
  });

  test('treats "!" for ttl as permanent redirect', () => {
    expect(
      _normalizeRedirects({
        '/foo': '/bar',
        '/foo2': '/bar#!',
      })
    ).toEqual({
      '/foo': { target: '/bar', status, ttl },
      '/foo2': { target: '/bar', status: 301 },
    });
  });

  test('Deals predictably with wonky targets', () => {
    expect(_normalizeRedirects({ '/foo': '/bar#3003#asdf' })).toEqual({
      '/foo': { target: '/bar', status, ttl: 3003 },
    }); // Only first of multiple "#anchors" is parsed

    expect(_normalizeRedirects({ '/foo': '/bar##3003' })).toEqual({
      '/foo': { target: '/bar', status, ttl },
    }); // Only first of multiple "#anchors" is parsed (2)

    expect(_normalizeRedirects({ '/foo': '/bar#3003-silly comment' })).toEqual({
      '/foo': { target: '/bar', status, ttl: 3003 },
    }); // Text after ttl value is trimmed/ignored

    expect(_normalizeRedirects({ '/foo': '/bar#wonky33' })).toEqual({
      '/foo': { target: '/bar', status, ttl },
    }); // Malformed ttl values are ignored
  });
});
