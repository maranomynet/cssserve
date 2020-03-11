import { ParsedModules } from './types';

const makeLinkHeaderValue = (
	versionFolder: string,
	modules: ParsedModules
): string | undefined =>
	modules
		.filter((moduleName) => typeof moduleName === 'string')
		.map((moduleName) => `</${versionFolder + moduleName}.css>;rel=preload;as=style`)
		.join(',') || undefined;

export default makeLinkHeaderValue;
