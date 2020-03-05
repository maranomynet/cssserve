import rc from 'rc';
import { name as pkgName } from '../package.json';

const appName = pkgName.split('/').pop() as string;
const HOUR = 60 * 60;

interface AppConfig {
	/** Port number that the CSS server runs on
	 *
	 * Default: `process.env.NODE_PORT || process.env.PORT || 4000`
	 */
	port: number;

	/** Path to the folder containing the server's static webroot
	 *
	 * Default: `"public/"`
	 * */
	staticFolder: string;

	/** Cache-Control max-age (in seconds) for static CSS files
	 * and other assets (fonts, images, etc.)
	 *
	 * Default: 24 hours
	 */
	ttl_static: number;

	/** Cache-Control max-age (in seconds) for bundling results
	 *
	 * Default: 1 hour
	 */
	ttl_bundle: number;

	/** Is the server proxied behind another server/proxy
	 * that provides **SSL and compression**?
	 *
	 * Default: `process.env.PROXIED === "true" || false`
	 */
	proxied: boolean;

	/** Path leading to the SSL key/cert files.
	 * Allows providing a file-name prefix so folder-names
	 * **must** include a trailing slash
	 *
	 * Example 1: `"../keys/my-"` results in:
	 * ```txt
	 *     ../keys/my-privkey.pem
	 *     ../keys/my-cert.pem
	 * ```
	 * Example 2: `"/foo/bar/"` results in:
	 * ```txt
	 *    /foo/bar/privkey.pem
	 *    /foo/bar/cert.pem
	 * ```
	 * Default: Uses unsigned cert/key files bundled with the server
	 */
	sslKeyPath?: string | null;

	/** (Optional) Full path to the SSL certificate file */
	sslCert?: string | null;
	/** (Optional) Full path to the SSL private key file */
	sslPrivkey?: string | null;
}

const config = rc(appName, {
	port: parseInt(process.env.NODE_PORT || process.env.PORT || '') || 4000,
	staticFolder: 'public/',
	ttl_static: 24 * HOUR,
	ttl_bundle: 1 * HOUR,
	proxied: /^true$/i.test(process.env.PROXIED || ''),
}) as AppConfig;

export default config;
