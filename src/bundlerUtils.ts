import { existsSync } from 'fs';
import { sync as glob } from 'glob';

type QueryObj = Record<string, string | Array<string> | undefined>;

// ---------------------------------------------------------------------------

/**
 * Returns the value of the first query parameter of a given name
 * ...defaulting to an empty string if no parameter is found.
 */
const getParamArr = (query: QueryObj, name: string): string => {
	const val = query[name];
	return val == null ? '' : typeof val === 'string' ? val : val[0];
};

// ---------------------------------------------------------------------------

/**
 * Checks if an URL token contains no spaces or funny characters.
 * Only allows `[a-z0-9-_.]`
 */
export const isSafeToken = (token: string | undefined): boolean =>
	!token || !(/[^a-z0-9-_.]/i.test(token) || /\.\./.test(token));

// ---------------------------------------------------------------------------

/**
 * Compares strings and sorts them by lowercase first
 * before doing a normal comparison.
 */
export const lowercaseFirstCompare = (a: string, b: string): number => {
	const aL = a.toLocaleLowerCase();
	const bL = b.toLocaleLowerCase();
	return aL > bL ? 1 : aL < bL ? -1 : a > b ? 1 : -1;
};
// ---------------------------------------------------------------------------

export const getModuleListFromQuery = (query: QueryObj) => {
	let allTokensValid = true;
	const modules = getParamArr(query, 'm')
		.split(',')
		.filter((token) => {
			allTokensValid = allTokensValid && isSafeToken(token);
			return token;
		});
	return allTokensValid ? modules.sort(lowercaseFirstCompare) : [];
};
// ---------------------------------------------------------------------------

export const resolveCssVersionFolder = (
	versionParam: string | undefined,
	staticFolder: string
): string | null => {
	if (versionParam && isSafeToken(versionParam)) {
		const cssFolder = staticFolder + 'css/';
		if (existsSync(cssFolder + versionParam)) {
			return 'css/' + versionParam + '/';
		}
		const versionFolders = glob(versionParam + '.*', { cwd: cssFolder });
		if (versionFolders.length) {
			const cutIdx = versionParam.length + 1;
			const topPointVersion = versionFolders
				.map((versionFolderName) => parseInt(versionFolderName.slice(cutIdx)))
				.sort((a, b) => (a > b ? 1 : -1))
				.pop() as number;
			if (!isNaN(topPointVersion)) {
				return 'css/' + versionParam + '.' + topPointVersion + '/';
			}
		}
	}
	return null;
};

// ---------------------------------------------------------------------------
