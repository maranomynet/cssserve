import lowercaseFirstCompare from './lowercaseFirstCompare.js';
import { getQueryParam, QueryObj } from './query.js';

// ---------------------------------------------------------------------------

const getModuleListFromQuery = (query: QueryObj): ReadonlyArray<string> =>
  (getQueryParam(query, 'm') || '')
    .trim()
    .split(/\s*,\s*/)
    .filter((token) => token)
    .sort(lowercaseFirstCompare);

export default getModuleListFromQuery;
