import { ParsedModules } from './types';

const makeCssFromModuleNames = (versionFolder: string, modules: ParsedModules): string =>
  modules
    .map((moduleName) =>
      typeof moduleName === 'string'
        ? `@import "/${versionFolder + moduleName}.css";\n`
        : `/* token ${JSON.stringify(moduleName.name)} is invalid */\n`
    )
    .join('');

export default makeCssFromModuleNames;
