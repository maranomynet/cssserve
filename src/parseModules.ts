import { existsSync, readFileSync } from 'fs';
import { onCacheRefresh } from './cacheRefresher';
import lowercaseFirstCompare from './lowercaseFirstCompare';
import parseDepsFromCSS from './parseDepsFromCSS';
import isSafeToken from './isSafeToken';
import { isDev } from './env';

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

// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------

export type ParsedModules = Array<string | { ignored: string }>;

const parseModules = (
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
		let contextFile: string | undefined;
		const parseDepsTree = (list: ParsedModules, moduleName: string): ParsedModules => {
			if (found[moduleName]) {
				return list;
			}
			if (isInvalidModule(moduleName)) {
				if (isDev) {
					console.info(
						'NOTE:' +
							'\n  Invalid @deps token ' +
							JSON.stringify(moduleName) +
							'\n  in file ' +
							contextFile
					);
				}
				return list.concat({ ignored: moduleName });
			}
			found[moduleName] = true;
			contextFile = sourceFolder + moduleName + '.css';
			const deps = getDepsFor(contextFile);
			return deps.reduce(parseDepsTree, list).concat([moduleName]);
		};
		modules = modules.slice(0).sort(lowercaseFirstCompare);
		resolve(modules.reduce(parseDepsTree, []));
	});

export default parseModules;
