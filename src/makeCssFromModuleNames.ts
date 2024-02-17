import { ParsedModules } from './types.js';

const makeCssFromModuleNames = (versionFolder: string, modules: ParsedModules): string =>
  modules
    .map((moduleName) =>
      typeof moduleName === 'string'
        ? `@import "/${versionFolder + moduleName}.css";\n`
        : moduleName.invalid
        ? `/* Uknown token: ${JSON.stringify(moduleName.name)} */\n`
        : `/* Token ${JSON.stringify(moduleName.name)} found, but contains no CSS */\n`
    )
    .join('');

export default makeCssFromModuleNames;
