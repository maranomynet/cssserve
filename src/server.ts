#!/usr/bin/env node
import fastify, { ServerOptionsAsHttp2, ServerOptionsAsSecureHttp2 } from 'fastify';
import fastifyCompress from 'fastify-compress';
import fastifyStatic from 'fastify-static';
import { readFileSync } from 'fs';
import cssBundler from './cssBundler';
import config from './config';
import { resolve } from 'path';
import { isProd, isDebug } from './env';

const {
	port,
	staticFolder,
	proxied,
	// sslKeyPath,
	sslCert,
	sslPrivkey,
	ttl_static,
} = config;

const sslKeyPath = config.sslKeyPath || __dirname + '/default-keys/';

const app = fastify(
	proxied
		? {}
		: ({
				http2: true,
				https: {
					allowHTTP1: true,
					cert: readFileSync(sslCert || sslKeyPath + 'cert.pem'),
					key: readFileSync(sslPrivkey || sslKeyPath + 'privkey.pem'),
				},
		  } as ServerOptionsAsHttp2 | ServerOptionsAsSecureHttp2)
);

if (!proxied) {
	app.register(fastifyCompress, { global: true });
}

app.register(fastifyStatic, {
	root: resolve(staticFolder),
	redirect: true,
	immutable: true,
	maxAge: ttl_static * 1000, // fastifyStatic uses milliseconds
	index: 'index.txt',
	// lastModified: false,
	etag: false, // Auto-generated from the file's modification date.
});

app.setNotFoundHandler((req, res) => {
	res.sendFile('_NotFound_.txt');
});
app.setErrorHandler((err, req, res) => {
	!isProd && console.error('ERROR:\n  ', err.message);
	isDebug && console.error(err);
	res.send('ERROR\n' + err.message);
});

app.get('/bundle/:version', cssBundler);

app.listen(port, '0.0.0.0', (err) => {
	if (err) {
		console.error(err);
	} else {
		const protocol = proxied ? 'http' : 'https';
		console.info('CSS server listening on ' + protocol + '://localhost:' + port);
	}
});
