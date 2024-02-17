export type QueryObj = Readonly<
  Record<string, string | ReadonlyArray<string> | undefined>
>;
/**
 * Returns the value of the first query parameter of a given name
 * ...returns undefined if no parameter is found.
 */
export const getQueryParam = (query: QueryObj, name: string): string | undefined => {
  const val = query[name];
  return val == null ? undefined : typeof val === 'string' ? val : val[0];
};
