/**
 * Compares strings and sorts them by lowercase first
 * before doing a normal comparison.
 */
const lowercaseFirstCompare = (a: string, b: string): number => {
  const aL = a.toLocaleLowerCase();
  const bL = b.toLocaleLowerCase();
  return aL > bL ? 1 : aL < bL ? -1 : a > b ? 1 : -1;
};

export default lowercaseFirstCompare;
