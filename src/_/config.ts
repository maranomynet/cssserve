import rc from 'rc';

import { AppConfig } from './AppConfig.js';
import { parseRedirects } from './parseRedirects.js';

const normalizePathSlash = (path: string) => path.replace(/\/*$/, '/');

const HOUR = 60 * 60;

const defaults: AppConfig = {
  port: 4000,
  staticFolder: 'public/',
  ttl_static: 24 * HOUR,
  ttl_bundle: 1 * HOUR,
  // ssl: true,
  // compression: true,
  cache: true,
  host: 'localhost',
  loudBadTokenErrors: process.env.NODE_ENV !== 'production',
};

const boolify = (value: unknown) => value !== 'false' && value !== '0' && !!value;

const config = rc('cssserve', defaults) as AppConfig;

const { proxied, compression, ssl } = config; // eslint-disable-line @typescript-eslint/no-deprecated
const useProxied = compression == null && ssl == null;

// enforce correct types
config.port = parseInt(process.env.NODE_PORT || process.env.PORT || '') || config.port;
config.staticFolder = normalizePathSlash(config.staticFolder.trim());
config.ttl_static = Number(config.ttl_static);
config.ttl_bundle = Number(config.ttl_bundle);
// config.cacheRefreshToken =
config.cache = Boolean(config.cache);
config.compression =
  compression != null ? boolify(compression) : useProxied ? !boolify(proxied) : true;
config.ssl = ssl != null ? boolify(ssl) : useProxied ? !boolify(proxied) : true;
config.sslKeyPath = config.sslKeyPath && config.sslKeyPath.trim();
// config.sslCert =
// config.sslPrivkey =
config.loudBadTokenErrors = boolify(config.loudBadTokenErrors);
config.preload = config.preload != null ? boolify(config.preload) : true;

config.redirects = parseRedirects(config.redirects, config.redirectsFile);

delete config.redirectsFile;
delete config.proxied; // eslint-disable-line @typescript-eslint/no-deprecated

export default config as Readonly<Omit<AppConfig, 'redirectsFile' | 'proxied'>>;
