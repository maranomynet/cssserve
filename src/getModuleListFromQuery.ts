import lowercaseFirstCompare from './lowercaseFirstCompare';
import { getQueryParam, QueryObj } from './query';

// ---------------------------------------------------------------------------

const getModuleListFromQuery = (query: QueryObj): ReadonlyArray<string> =>
  (getQueryParam(query, 'm') || '')
    .trim()
    .split(/\s*,\s*/)
    .filter((token) => token)
    .sort(lowercaseFirstCompare);

export default getModuleListFromQuery;
