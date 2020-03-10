import { RequestHandler, FastifyRequest } from 'fastify';
import resolveCssVersionFolder from './resolveCssVersionFolder';
import parseModules from './parseModules';
import { refreshCache, onCacheRefresh } from './cacheRefresher';
import getModuleListFromQuery from './getModuleListFromQuery';
import makeLinkHeaderValue from './makeLinkHeaderValue';
import makeCssFromModuleNames from './makeCssFromModuleNames';
import LRUCache from 'lru-cache';
import config from './config';

const { ttl_bundle, staticFolder, cacheRefreshToken } = config;

const CACHE_CONTROL_VALUE = ttl_bundle
	? 'public, max-age=' + ttl_bundle + ', immutable'
	: undefined;

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

const retInvalidVersion = (versionParam: string) =>
	Promise.reject('Invalid version ' + JSON.stringify(versionParam));

const getCssBundle = (req: FastifyRequest): Promise<BundleData> =>
	Promise.resolve().then(() => {
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
			return retInvalidVersion(versionParam);
		}

		const versionFolder = resolveCssVersionFolder(staticFolder, versionParam);
		if (!versionFolder) {
			return retInvalidVersion(versionParam);
		}
		const modules = getModuleListFromQuery(req.query);

		if (modules.length === 0) {
			return Promise.reject('No modules specified');
		}

		const normalizedTokens = versionFolder + '|' + modules.join(',');
		cachedBundle = bundleCache.get(normalizedTokens);
		if (cachedBundle) {
			bundleCache.set(url, cachedBundle);
			return cachedBundle;
		}

		return parseModules(staticFolder + versionFolder, modules).then((parsedModules) => {
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

	return getCssBundle(req).then(({ css, linkHeader }) => {
		res.headers({
			Link: linkHeader,
			ETag: lastModified,
			'Content-Type': 'text/css; charset=UTF-8',
			'Cache-Control': CACHE_CONTROL_VALUE,
		});
		res.status(200);
		res.send(css);
	});
};

export default cssBundler;
