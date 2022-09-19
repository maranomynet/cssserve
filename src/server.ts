#!/usr/bin/env node
import fastifyCompress from '@fastify/compress';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastify, { FastifyInstance } from 'fastify';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import config from './config';
import cssBundler from './cssBundler';
import { isDebug, isProd } from './env';
import { registerRedirects } from './registerRedirects';

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

const app = proxied
  ? fastify({})
  : (fastify({
      http2: true,
      https: {
        allowHTTP1: true,
        cert: readFileSync(sslCert || sslKeyPath + 'cert.pem'),
        key: readFileSync(sslPrivkey || sslKeyPath + 'privkey.pem'),
      },
    }) as unknown as FastifyInstance);

if (!proxied) {
  app.register(fastifyCompress);
}

app.register(fastifyCors, {
  origin: true,
  methods: ['GET'],
});

registerRedirects(app);

app.register(fastifyStatic, {
  root: resolve(staticFolder),
  redirect: true,
  immutable: true,
  maxAge: ttl_static * 1000, // fastifyStatic uses milliseconds
  // lastModified: false,
  etag: false, // Auto-generated from the file's modification date.
});

app.setNotFoundHandler((req, res) => {
  res.sendFile('_NotFound_.html');
});
app.setErrorHandler((err, req, res) => {
  !isProd && console.error('ERROR:\n  ', err.message);
  isDebug && console.error(err);
  res.send('ERROR\n' + err.message);
});

app.get('/bundle/:version', cssBundler);

app
  .listen({ port })
  .then(() => {
    const protocol = proxied ? 'http' : 'https';
    console.info('CSS server listening on ' + protocol + '://localhost:' + port);
  })
  .catch((err) => {
    if (err) {
      console.error(err);
    }
  });
