import o from 'ospec';

import config from './config';
import { _normalizeRedirects, MIN_TTL } from './registerRedirects';

const status = 307;
const ttl = config.ttl_static;

o.spec('_normalizeRedirects', () => {
  o('works', () => {
    o(_normalizeRedirects(undefined)).equals(undefined);
    o(
      _normalizeRedirects({
        '/foo': '/bar',
        '/foo2': '/bar2',
        '/foo3': 'https://www.external.com/bar3',
      })
    ).deepEquals({
      '/foo': { target: '/bar', status, ttl },
      '/foo2': { target: '/bar2', status, ttl },
      '/foo3': { target: 'https://www.external.com/bar3', status, ttl },
    });
  });

  o('makes trailing slashes optional', () => {
    o(
      _normalizeRedirects({
        '/foo/': '/bar',
      })
    ).deepEquals({
      '/foo/': { target: '/bar', status, ttl },
      '/foo': { target: '/bar', status, ttl },
    });
    o(
      _normalizeRedirects({
        '/foo/': '/bar',
        '/foo': '/barbar',
      })
    ).deepEquals({
      '/foo/': { target: '/bar', status, ttl },
      '/foo': { target: '/barbar', status, ttl },
    })('respects existing non-slash redirects');
    o(
      _normalizeRedirects({
        '/foo': '/barbar',
        '/foo/': '/bar',
      })
    ).deepEquals({
      '/foo/': { target: '/bar', status, ttl },
      '/foo': { target: '/barbar', status, ttl },
    })('respects existing non-slash redirects regardless of declaration order');
  });

  o('parses custom ttl from target "#anchor"', () => {
    o(
      _normalizeRedirects({
        '/foo': '/bar#666',
        '/foo2': 'https://www.external.com/bar3#99',
      })
    ).deepEquals({
      '/foo': { target: '/bar', status, ttl: 666 },
      '/foo2': { target: 'https://www.external.com/bar3', status, ttl: 99 },
    });

    o(_normalizeRedirects({ '/foo': '/bar#666.6' })).deepEquals({
      '/foo': { target: '/bar', status, ttl: 667 },
    })('rounds floats');

    o(_normalizeRedirects({ '/foo': '/bar#1' })).deepEquals({
      '/foo': { target: '/bar', status, ttl: MIN_TTL },
    })(`minimum ttl is ${MIN_TTL} seconds`);

    o(_normalizeRedirects({ '/foo': '/bar#-999.0' })).deepEquals({
      '/foo': { target: '/bar', status, ttl: MIN_TTL },
    })(`Negative ttl is bounded at ${MIN_TTL} seconds`);

    o(_normalizeRedirects({ '/foo': '/bar#999999999999' })).deepEquals({
      '/foo': { target: '/bar', status, ttl: 999999999999 },
    })(`Ttl has no upper bound`);
  });

  o('treats "!" for ttl as permanent redirect', () => {
    o(
      _normalizeRedirects({
        '/foo': '/bar',
        '/foo2': '/bar#!',
      })
    ).deepEquals({
      '/foo': { target: '/bar', status, ttl },
      '/foo2': { target: '/bar', status: 301 },
    });
  });

  o('Deals predictably with wonky targets', () => {
    o(_normalizeRedirects({ '/foo': '/bar#3003#asdf' })).deepEquals({
      '/foo': { target: '/bar', status, ttl: 3003 },
    })('Only first of multiple "#anchors" is parsed');

    o(_normalizeRedirects({ '/foo': '/bar##3003' })).deepEquals({
      '/foo': { target: '/bar', status, ttl },
    })('Only first of multiple "#anchors" is parsed (2)');

    o(_normalizeRedirects({ '/foo': '/bar#3003-silly comment' })).deepEquals({
      '/foo': { target: '/bar', status, ttl: 3003 },
    })('Text after ttl value is trimmed/ignored');

    o(_normalizeRedirects({ '/foo': '/bar#wonky33' })).deepEquals({
      '/foo': { target: '/bar', status, ttl },
    })('Malformed ttl values are ignored');
  });
});
