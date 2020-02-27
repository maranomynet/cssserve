// import { Http2ServerResponse, Http2ServerRequest } from 'http2';
import fastify, { ServerOptionsAsSecureHttp2 } from 'fastify';
import fastifyCompress from 'fastify-compress';
import fastifyStatic from 'fastify-static';
import { readFileSync } from 'fs';
import cssBundler from './cssBundler';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// const projRoot = process.cwd() + '/'; // fails if server is started from folder other than project root
const projRoot = __dirname + '/../';

const isProxied = /^(?:true|yes)$/i.test(process.env.PROXIED || '');
const port = parseInt(process.env.NODE_PORT || '') || 4000;

const app = fastify({
	http2: true,
	https: isProxied
		? undefined
		: {
				allowHTTP1: true,
				cert: readFileSync(projRoot + 'dev-keys/localhost-cert.pem'),
				key: readFileSync(projRoot + 'dev-keys/localhost-privkey.pem'),
		  },
} as ServerOptionsAsSecureHttp2);

if (!isProxied) {
	app.register(fastifyCompress, { global: true });
}

app.register(fastifyStatic, {
	root: projRoot + '/public/',
	redirect: true,
	immutable: true,
	maxAge: 24 * HOUR, // in milliseconds
	index: 'index.txt',
	// lastModified: false,
	etag: false, // Auto-generated from the file's modification date.
});

app.setNotFoundHandler((req, res) => {
	res.sendFile('_NotFound_.txt');
});

app.setErrorHandler((err, req, res) => {
	console.error(err);
	res.sendFile('_Error_.txt');
});

app.get('/bundle/:version', cssBundler);

app.listen(port, (err) => {
	if (err) {
		console.error(err);
	} else {
		console.info('CSS server listening on https://localhost:' + port);
	}
});
