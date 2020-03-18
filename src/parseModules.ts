import { existsSync, readFileSync } from 'fs';
import { onCacheRefresh } from './cacheRefresher';
import lowercaseFirstCompare from './lowercaseFirstCompare';
import parseDepsFromCSS, { CssDepsList } from './parseDepsFromCSS';
import isSafeToken from './isSafeToken';
import { isDev } from './env';
import { ParsedModules, UnsafeModuleTokenError, NonExistentModuleError } from './types';

// ---------------------------------------------------------------------------

const makeModuleValidator = (sourceFolder: string) => (moduleName: string) => {
	if (!isSafeToken(moduleName)) {
		return new UnsafeModuleTokenError(moduleName);
	} else if (!existsSync(sourceFolder + moduleName + '.css')) {
		return new NonExistentModuleError(moduleName);
	}
};

const findFirstError = (
	modules: ReadonlyArray<string>,
	isInvalidModule: ReturnType<typeof makeModuleValidator>
) => {
	let moduleError: undefined | NonExistentModuleError | UnsafeModuleTokenError;
	modules.forEach((moduleName) => {
		moduleError = moduleError || isInvalidModule(moduleName);
	});
	return moduleError;
};

// ---------------------------------------------------------------------------

let _depsCache: Partial<Record<string, CssDepsList>> = {};
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

const parseModules = (
	sourceFolder: string,
	modules: ReadonlyArray<string>
): Promise<ParsedModules> =>
	new Promise((resolve, reject) => {
		const isInvalidModule = makeModuleValidator(sourceFolder);

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

			return deps.reduce(parseDepsTree, list).concat(deps.hasCSS ? [moduleName] : []);
		};

		modules = modules.slice(0).sort(lowercaseFirstCompare);

		resolve(modules.reduce(parseDepsTree, []));
	});

export default parseModules;
