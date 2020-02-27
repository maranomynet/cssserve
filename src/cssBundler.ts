import { RequestHandler, FastifyRequest } from 'fastify';

function getQueryParam(req: FastifyRequest, name: string, noNull: true): Array<string>;
function getQueryParam(
	req: FastifyRequest,
	name: string,
	noNull?: false
): Array<string> | null;

function getQueryParam(
	req: FastifyRequest,
	name: string,
	noNull?: boolean
): Array<string> | null {
	const val = req.query[name] as string | Array<string> | undefined;
	if (val == null) {
		return noNull ? [''] : null;
	}
	return typeof val === 'string' ? [val] : val;
}

// FIXME: Make compression work
// TODO: Set Cache-Control, max-age, immutable, etc.
// TODO: Learn more about RequestHandlers, Middlewares, etc. in  Fastify

const cssBundler: RequestHandler = (req, res) => {
	const version = req.params.version as string | undefined;
	const modules = getQueryParam(req, 'm', true)
		.join(',')
		.split(',')
		.sort();

	console.info({ version });
	console.info({ modules });

	if (version) {
		res.status(200).send('GET ' + req.req.url);
	}
};

export default cssBundler;
