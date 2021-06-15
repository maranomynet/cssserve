import { RequestHandler, FastifyRequest } from 'fastify';
import resolveCssVersionFolder from './resolveCssVersionFolder';
import parseModules from './parseModules';
import { refreshCache, onCacheRefresh } from './cacheRefresher';
import getModuleListFromQuery from './getModuleListFromQuery';
import makeLinkHeaderValue from './makeLinkHeaderValue';
import makeCssFromModuleNames from './makeCssFromModuleNames';
import LRUCache from 'lru-cache';
import config from './config';
import { NotFoundError, UnsafeModuleTokenError } from './types';

const { ttl_bundle, staticFolder, cacheRefreshToken, cache, loudBadTokenErrors } = config;

const CACHE_CONTROL_VALUE =
	'public, max-age=' + ttl_bundle + (ttl_bundle ? ', immutable' : '');

// ===========================================================================

interface BundleData {
	css: string;
	linkHeader?: string;
}

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
			const url = req.req.url as string;

			let cachedBundle = bundleCache.get(url);
			if (cachedBundle) {
				return cachedBundle;
			}

			const versionParam = ((req.params.version as string) || '')
				// tolerate trailing slash
				.replace(/\/$/, '');

			if (versionParam === cacheRefreshToken) {
				console.info('Nudging cache');
				refreshCache();
				throw new VersionError(versionParam);
			}

			const versionFolder = resolveCssVersionFolder(staticFolder, versionParam);
			if (!versionFolder) {
				throw new VersionError(versionParam);
			}

			const modules = getModuleListFromQuery(req.query);
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
				const linkHeader = makeLinkHeaderValue(versionFolder, parsedModules);
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

const cssBundler: RequestHandler = (req, res) => {
	const browserEtag = req.headers['If-None-Match'];
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
			res.headers({
				Link: linkHeader,
				ETag: lastModified,
				'Content-Type': 'text/css; charset=UTF-8',
				'Cache-Control': CACHE_CONTROL_VALUE,
			});
			res.status(200);
			res.send(css);
		}
	});
};

export default cssBundler;
