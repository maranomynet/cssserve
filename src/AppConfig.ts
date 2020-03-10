export interface AppConfig {
	/**
	 *
	 * Port number that the CSS server runs on
	 *
	 * Default: `4000`
	 */
	port: number;

	/**
	 * Path to the folder containing the server's static webroot
	 *
	 * Default: `"public/"`
	 * */
	staticFolder: string;

	/**
	 * Cache-Control max-age (in seconds) for static CSS files
	 * and other assets (fonts, images, etc.).
	 *
	 * `0` disable caching
	 *
	 * Default: 24 hours
	 */
	ttl_static: number;

	/**
	 * Cache-Control max-age (in seconds) for bundling results.
	 *
	 * 0 disable caching
	 *
	 * Default: 1 hour
	 */
	ttl_bundle: number;

	/**
	 * Magic bundle URL suffix that starts a cache-staleness check.
	 * Calls to that endpoint always return a 500 invalid module.
	 *
	 * Default: `undefined`
	 */
	cacheRefreshToken?: string | null;

	/**
	 * Disable internal caching (Useful during rapid CSS development)
	 *
	 * Default: `true`
	 */
	cache?: boolean;

	/**
	 * Is the server proxied behind another server/proxy
	 * that provides **SSL and compression**?
	 *
	 * Default: `false`
	 */
	proxied: boolean;

	/**
	 * Path leading to the SSL key/cert files.
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
	 * Default: `undefined` (Uses unsigned cert/key files bundled with the server)
	 */
	sslKeyPath?: string | null;

	/**
	 * (Optional) Full path to the SSL certificate file */
	sslCert?: string | null;
	/**
	 * (Optional) Full path to the SSL private key file */
	sslPrivkey?: string | null;
}
