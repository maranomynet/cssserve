import lowercaseFirstCompare from './lowercaseFirstCompare';

type QueryObj = Readonly<Record<string, string | ReadonlyArray<string> | undefined>>;

/**
 * Returns the value of the first query parameter of a given name
 * ...defaulting to an empty string if no parameter is found.
 */
const getParamArr = (query: QueryObj, name: string): string => {
	const val = query[name];
	return val == null ? '' : typeof val === 'string' ? val : val[0];
};

// ---------------------------------------------------------------------------

const getModuleListFromQuery = (query: QueryObj): ReadonlyArray<string> =>
	getParamArr(query, 'm')
		.trim()
		.split(/\s*,\s*/)
		.filter((token) => token)
		.sort(lowercaseFirstCompare);

export default getModuleListFromQuery;
