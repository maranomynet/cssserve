import { existsSync, readFileSync } from 'fs';

import { AppConfig } from './AppConfig.js';
import { onCacheRefresh } from './cacheRefresher.js';
import { isDev, logInfo } from './env.js';
import isSafeToken from './isSafeToken.js';
import lowercaseFirstCompare from './lowercaseFirstCompare.js';
import parseDepsFromCSS, { CssDepsList } from './parseDepsFromCSS.js';
import {
  NonExistentModuleError,
  ParsedModules,
  UnsafeModuleTokenError,
} from './types.js';

// ---------------------------------------------------------------------------

const makeModuleValidator = (sourceFolder: string) => (moduleName: string) => {
  if (!isSafeToken(moduleName)) {
    return new UnsafeModuleTokenError(moduleName);
  } else if (!existsSync(`${sourceFolder + moduleName}.css`)) {
    return new NonExistentModuleError(moduleName);
  }
};

const findFirstError = (
  modules: ReadonlyArray<string>,
  isInvalidModule: ReturnType<typeof makeModuleValidator>,
  loudErrors: boolean | undefined
) => {
  let moduleError: ReturnType<typeof isInvalidModule>;
  modules.find((moduleName) => {
    const error = isInvalidModule(moduleName);
    if (error && (loudErrors || error instanceof UnsafeModuleTokenError)) {
      moduleError = error;
      return true; // exit loop early
    }
  });
  return moduleError;
};

// ---------------------------------------------------------------------------

let _depsCache: Partial<Record<string, CssDepsList>> = {};
onCacheRefresh(() => {
  _depsCache = {};
});

const getDepsFor = (file: string, cache = true) => {
  let deps = cache && _depsCache[file];
  if (!deps) {
    const css = readFileSync(file, 'utf8');
    deps = parseDepsFromCSS(css).sort(lowercaseFirstCompare);
    _depsCache[file] = deps;
  }
  return deps;
};

const parseModules = (
  modules: ReadonlyArray<string>,
  sourceFolder: string,
  opts: Pick<AppConfig, 'cache' | 'loudBadTokenErrors'>
): Promise<ParsedModules> =>
  new Promise((resolve, reject) => {
    const isInvalidModule = makeModuleValidator(sourceFolder);

    // Check if the top-level modules coming from the URL are safe and sane
    const moduleError = findFirstError(modules, isInvalidModule, opts.loudBadTokenErrors);
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
          logInfo(
            `NOTE:` +
              `\n  Invalid @deps token ${JSON.stringify(
                moduleName
              )}\n  in file ${contextFile}`
          );
        }
        return list.concat({ name: moduleName, invalid: true });
      }

      found[moduleName] = true;
      contextFile = `${sourceFolder + moduleName}.css`;
      const deps = getDepsFor(contextFile, opts.cache);

      return deps
        .reduce(parseDepsTree, list)
        .concat(deps.hasCSS ? [moduleName] : [{ name: moduleName, empty: true }]);
    };

    modules = modules.slice(0).sort(lowercaseFirstCompare);

    resolve(modules.reduce(parseDepsTree, []));
  });

export default parseModules;
