import { RequestHandler } from 'fastify';
import { getModuleListFromQuery, resolveCssVersionFolder } from './bundlerUtils';
import config from './config';

const { ttl_bundle, staticFolder } = config;

// FIXME: Make compression work
// TODO: Set Cache-Control, max-age, immutable, etc.
// TODO: LRU cache resulting CSS based on req.req.url and sorted version + module list

const cssBundler: RequestHandler = (req, res) => {
	const versionParam = req.params.version as string | undefined;
	const versionFolder = resolveCssVersionFolder(versionParam, staticFolder);
	if (!versionFolder) {
		return Promise.reject('Invalid Version');
	}
	const modules = getModuleListFromQuery(req.query);

	console.info({ versionParam, versionFolder, modules });

	res.status(200).send('GET ' + req.req.url);
};

export default cssBundler;
