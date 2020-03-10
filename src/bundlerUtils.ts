import { existsSync, readFileSync } from 'fs';
import { sync as glob } from 'glob';
import { onCacheRefresh } from './cacheRefresher';

type QueryObj = Readonly<Record<string, string | ReadonlyArray<string> | undefined>>;

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

export const getAllValidCssVersions = (staticFolder: string): Record<string, string> => {
	const versions: Record<string, string> = {};
	const cssFolder = staticFolder + 'css/';
	const versionFolders = glob('*/', { cwd: cssFolder })
		// chop trailing "/" off directoryNames
		.map((dirName) => dirName.slice(0, -1));

	versionFolders.forEach((name) => {
		const superVersions = name
			.split('.')
			.slice(0, -1)
			.reduce<Array<string>>(
				(superVersions, token, i, arr) =>
					superVersions.concat([arr.slice(0, i + 1).join('.')]),
				[]
			);
		superVersions.forEach((superVersion) => {
			if (!versions[superVersion]) {
				const cutIdx = superVersion.length + 1;
				const topPointVersion = versionFolders
					.filter((subName) => subName.startsWith(superVersion + '.'))
					.map((subName) => subName.slice(cutIdx))
					.filter((minorVersionSuffix) => !/[^0-9.]/.test(minorVersionSuffix))
					.map((minorVersionSuffix) => {
						const arr = minorVersionSuffix.split('.').map((bit) => parseInt(bit));
						arr.length = 4; // Normalize the length for saner sort.
						return arr;
					})
					.sort((a, b) => {
						const idx = a.findIndex((_, i) => a[i] !== b[i]);
						return (a[idx] || 0) > (b[idx] || 0) ? 1 : -1;
					})
					.pop() as ReadonlyArray<number>;
				if (topPointVersion) {
					const pointVersionSuffix = topPointVersion.join('.').replace(/\.+$/, '');
					versions[superVersion] = 'css/' + superVersion + '.' + pointVersionSuffix + '/';
				}
			}
		});

		versionFolders.filter((fname) => fname.startsWith(name + '.'));
	});
	versionFolders.forEach((name) => {
		versions[name] = versions[name] || 'css/' + name + '/';
	});
	return versions;
};

// ---------------------------------------------------------------------------

let _validVersions: Record<string, Record<string, string>> = {};
onCacheRefresh(() => {
	_validVersions = {};
});

export const resolveCssVersionFolder = (
	staticFolder: string,
	versionParam: string | undefined
): string | null => {
	if (!versionParam || !isSafeToken(versionParam)) {
		return null;
	}
	let versions = _validVersions[staticFolder];
	if (!versions) {
		versions = _validVersions[staticFolder] = getAllValidCssVersions(staticFolder);
	}
	return versions[versionParam] || null;
};

// ---------------------------------------------------------------------------

export const parseDepsFromCSS = (cssSource: string): Array<string> => {
	// if (/\/\*!\s*@deps\s/.test(cssSource.slice(0, 1000))) {
	const match = cssSource.match(/\/\*!\s*@deps\s([^*]+)\*\//);
	if (match) {
		return match[1]
			.replace(/\n|,|;/g, ' ')
			.trim()
			.split(/\s+/);
	}
	// }
	return [];
};

// ---------------------------------------------------------------------------

export class ModuleError extends Error {
	__proto__: Error; // TS Extend native type Workaround (https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work)
	moduleName: string;

	constructor(message: string, moduleName: string) {
		super(message + ': ' + JSON.stringify(moduleName));
		this.__proto__ = new.target.prototype; // TS Extend native type Workaround
		this.moduleName = moduleName;
	}
}
export class NonExistentModuleError extends ModuleError {
	constructor(moduleName: string) {
		super('No CSS file matches token', moduleName);
	}
}
export class UnsafeModuleTokenError extends ModuleError {
	constructor(moduleName: string) {
		super('Invalid/Rejected token', moduleName);
	}
}

const isInvalidModuleForFolder = (sourceFolder: string) => (moduleName: string) => {
	if (!isSafeToken(moduleName)) {
		return new UnsafeModuleTokenError(moduleName);
	} else if (!existsSync(sourceFolder + moduleName + '.css')) {
		return new NonExistentModuleError(moduleName);
	}
};

const findFirstError = (
	modules: ReadonlyArray<string>,
	isInvalidModule: ReturnType<typeof isInvalidModuleForFolder>
) => {
	let moduleError: undefined | NonExistentModuleError | UnsafeModuleTokenError;
	modules.forEach((moduleName) => {
		moduleError = moduleError || isInvalidModule(moduleName);
	});
	return moduleError;
};

let _depsCache: Partial<Record<string, Array<string>>> = {};
onCacheRefresh(() => {
	_depsCache = {};
});
const getDepsFor = (file: string) => {
	let deps = _depsCache[file];
	if (!deps) {
		const css = readFileSync(file, 'utf8');
		deps = parseDepsFromCSS(css).sort(lowercaseFirstCompare);
		_depsCache[file] = deps;
	}
	return deps;
};

export type ParsedModules = Array<string | { ignored: string }>;

export const parseModules = (
	sourceFolder: string,
	modules: ReadonlyArray<string>
): Promise<ParsedModules> =>
	new Promise((resolve, reject) => {
		const isInvalidModule = isInvalidModuleForFolder(sourceFolder);
		// Check if the top-level modules coming from the URL are safe and sane
		const moduleError = findFirstError(modules, isInvalidModule);
		if (moduleError) {
			reject(moduleError);
			return;
		}
		const found: Partial<Record<string, true>> = {};
		const parseDepsTree = (list: ParsedModules, moduleName: string): ParsedModules => {
			if (found[moduleName]) {
				return list;
			}
			if (isInvalidModule(moduleName)) {
				return list.concat({ ignored: moduleName });
			}
			found[moduleName] = true;
			const deps = getDepsFor(sourceFolder + moduleName + '.css');
			return deps.reduce(parseDepsTree, list).concat([moduleName]);
		};
		modules = modules.slice(0).sort(lowercaseFirstCompare);
		resolve(modules.reduce(parseDepsTree, []));
	});

// ---------------------------------------------------------------------------

export const makeCssFromModuleNames = (
	versionFolder: string,
	modules: ParsedModules
): string =>
	modules
		.map((moduleName) =>
			typeof moduleName === 'string'
				? `@import "/${versionFolder + moduleName}.css";\n`
				: `/* token ${JSON.stringify(moduleName.ignored)} ignored */\n`
		)
		.join('');

// ---------------------------------------------------------------------------

export const makeLinkHeaderValue = (
	versionFolder: string,
	modules: ParsedModules
): string | undefined =>
	modules
		.filter((moduleName) => typeof moduleName === 'string')
		.map((moduleName) => `</${versionFolder + moduleName}.css>;rel=preload;as=style`)
		.join(',') || undefined;
