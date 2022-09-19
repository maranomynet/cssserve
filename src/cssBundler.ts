import { FastifyReply, FastifyRequest } from 'fastify';
import LRUCache from 'lru-cache';

import { onCacheRefresh, refreshCache } from './cacheRefresher';
import config from './config';
import getModuleListFromQuery, { QueryObj } from './getModuleListFromQuery';
import makeCssFromModuleNames from './makeCssFromModuleNames';
import makeLinkHeaderValue from './makeLinkHeaderValue';
import parseModules from './parseModules';
import resolveCssVersionFolder from './resolveCssVersionFolder';
import { NotFoundError, UnsafeModuleTokenError } from './types';

const {
  ttl_bundle,
  staticFolder,
  cacheRefreshToken,
  cache,
  loudBadTokenErrors,
  preload,
} = config;

const CACHE_CONTROL_VALUE =
  'public, max-age=' + ttl_bundle + (ttl_bundle ? ', immutable' : '');

// ===========================================================================

type BundleData = {
  css: string;
  linkHeader?: string;
};

let bundleCache: LRUCache<string, BundleData>;
let lastModified: number;

const makeBundleCache = () => {
  bundleCache = new LRUCache<string, BundleData>({
    // With maxAge `undefined` means infinite cache-lifetime,
    // but `-1` makes everything immediately stale - effectively
    // disabling any caching.
    maxAge: config.cache ? undefined : -1,
    // number of items (unless `length` option is set)
    max: 1000,
  });
  lastModified = Date.now();
};
makeBundleCache();
onCacheRefresh(makeBundleCache);

// ===========================================================================

class VersionError extends NotFoundError {
  constructor(versionParam: string) {
    super('Invalid version ' + JSON.stringify(versionParam));
  }
}

const getCssBundle = (
  req: FastifyRequest
): Promise<BundleData | { error: NotFoundError }> =>
  Promise.resolve()
    .then(() => {
      const url = req.raw.url as string;

      let cachedBundle = bundleCache.get(url);
      if (cachedBundle) {
        return cachedBundle;
      }

      const versionParam = ((req.params as { version?: string }).version || '')
        // tolerate trailing slash
        .replace(/\/$/, '');

      if (versionParam === cacheRefreshToken) {
        console.info('Nudging cache');
        refreshCache();
        // Pretend nothing happened.
        throw new VersionError(versionParam);
      }

      const versionFolder = resolveCssVersionFolder(staticFolder, versionParam);
      if (!versionFolder) {
        throw new VersionError(versionParam);
      }

      const modules = getModuleListFromQuery(req.query as QueryObj);
      if (modules.length === 0) {
        throw new NotFoundError('No modules specified');
      }

      // Check if a cached result exists for the normalized version of the token list
      const normalizedTokens = versionFolder + '|' + modules.join(',');
      cachedBundle = bundleCache.get(normalizedTokens);
      if (cachedBundle) {
        // make the current url alias for the normalized token list
        bundleCache.set(url, cachedBundle);
        return cachedBundle;
      }

      return parseModules(modules, staticFolder + versionFolder, {
        cache,
        loudBadTokenErrors,
      }).then((parsedModules) => {
        const linkHeader = preload
          ? makeLinkHeaderValue(versionFolder, parsedModules)
          : undefined;
        const css = makeCssFromModuleNames(versionFolder, parsedModules);
        const bundle = {
          css,
          linkHeader,
        };

        bundleCache.set(url, bundle);
        bundleCache.set(normalizedTokens, bundle);
        return bundle;
      });
    })
    .catch((error) => {
      if (error instanceof NotFoundError) {
        return { error };
      }
      throw error;
    });

// ===========================================================================

const cssBundler = (req: FastifyRequest, res: FastifyReply) => {
  const browserEtag = Number(req.headers['If-None-Match']) || 0;
  if (browserEtag >= lastModified) {
    res
      .headers({
        ETag: lastModified,
        'Cache-Control': CACHE_CONTROL_VALUE,
      })
      .status(304)
      .send('');
    return;
  }

  return getCssBundle(req).then((result) => {
    if ('error' in result) {
      const status = result.error instanceof UnsafeModuleTokenError ? 403 : 404;
      res.status(status);
      res.send(result.error.message);
    } else {
      const { css, linkHeader } = result;
      const headers: Parameters<typeof res.headers>[0] = {
        Link: linkHeader,
        ETag: lastModified,
        'Content-Type': 'text/css; charset=UTF-8',
        'Cache-Control': CACHE_CONTROL_VALUE,
      };
      if (!config.preload) {
        delete headers.Link;
      }
      res.headers(headers);
      res.status(200);
      res.send(css);
    }
  });
};

export default cssBundler;
