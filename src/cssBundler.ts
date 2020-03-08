import { RequestHandler } from 'fastify';
import {
	getModuleListFromQuery,
	resolveCssVersionFolder,
	parseModules,
	makeCssFromModuleNames,
} from './bundlerUtils';
import config from './config';

const { ttl_bundle, staticFolder } = config;

// FIXME: Make compression work
// TODO: Set Cache-Control, max-age, immutable, etc.
// TODO: LRU cache resulting CSS based on req.req.url and sorted version + module list

const cssBundler: RequestHandler = (req, res) => {
	// TODO: Check cache for req.req.url
	const versionParam = req.params.version as string | undefined;
	const versionFolder = resolveCssVersionFolder(staticFolder, versionParam);
	if (!versionFolder) {
		return Promise.reject('Invalid version ' + JSON.stringify(versionParam));
	}
	const modules = getModuleListFromQuery(req.query);

	if (modules.length === 0) {
		return Promise.reject('No modules specified');
	}
	// TODO: Check cache for versionParam +'/'+ modules.join(',')

	return parseModules(staticFolder + versionFolder, modules).then((modules) => {
		const css = makeCssFromModuleNames(versionFolder, modules);
		// TODO: Save to Cache
		res.status(200).send(css);
	});
};

export default cssBundler;
