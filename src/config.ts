import rc from 'rc';
import { name as pkgName } from '../package.json';
import { AppConfig } from './AppConfig';

const normalizePathSlash = (path: string) => path.replace(/\/*$/, '/');

const appName = pkgName.split('/').pop() as string;
const HOUR = 60 * 60;

const defaults = {
	port: 4000,
	staticFolder: 'public/',
	ttl_static: 24 * HOUR,
	ttl_bundle: 1 * HOUR,
	proxied: false,
	cache: true,
	loudBadTokenErrors: process.env.NODE_ENV !== 'production',
};

const config = rc(appName, defaults) as AppConfig;

// enforce correct types
config.port = parseInt(process.env.NODE_PORT || process.env.PORT || '') || config.port;
config.staticFolder = normalizePathSlash(config.staticFolder.trim());
config.ttl_static = Number(config.ttl_static);
config.ttl_bundle = Number(config.ttl_bundle);
// config.cacheRefreshToken =
config.cache = Boolean(config.cache);
config.proxied = Boolean(config.proxied);
config.sslKeyPath = config.sslKeyPath && config.sslKeyPath.trim();
// config.sslCert =
// config.sslPrivkey =
config.loudBadTokenErrors = Boolean(config.loudBadTokenErrors);

export default config as Readonly<AppConfig>;
