import rc from 'rc';
import { name as pkgName } from '../package.json';
import { AppConfig } from './AppConfig';

const appName = pkgName.split('/').pop() as string;
const HOUR = 60 * 60;

const config = rc(appName, {
	port: parseInt(process.env.NODE_PORT || process.env.PORT || '') || 4000,
	staticFolder: 'public/',
	ttl_static: 24 * HOUR,
	ttl_bundle: 1 * HOUR,
	proxied: /^true$/i.test(process.env.PROXIED || ''),
	cache: true,
}) as AppConfig;

const normalizePathSlash = (path: string) => path.replace(/\/*$/, '/');

config.staticFolder = normalizePathSlash(config.staticFolder.trim());

config.sslKeyPath = config.sslKeyPath && config.sslKeyPath.trim();

export default config as Readonly<AppConfig>;
