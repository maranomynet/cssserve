import o from 'ospec';

import getModuleListFromQuery from './getModuleListFromQuery';

// ---------------------------------------------------------------------------

o.spec('getModuleListFromQuery', () => {
  const empty: Array<string> = [];
  o('finds the m param and splits it on commas, and sorts the list', () => {
    // basic single token
    o(getModuleListFromQuery({ m: 'Module' })).deepEquals(['Module']);
    // Splits on commas
    o(getModuleListFromQuery({ m: 'A,B,C' })).deepEquals(['A', 'B', 'C']);
    // Sorting
    o(getModuleListFromQuery({ m: 'C,_B,A' })).deepEquals(['_B', 'A', 'C']);
  });

  o('Accepts params with spaces and invalid tokens', () => {
    // Evil/unsafe module token
    o(getModuleListFromQuery({ m: '../A, ,' })).deepEquals(['../A']);
    // Spaces are not trimmed
    o(getModuleListFromQuery({ m: 'A ,B, C,,' })).deepEquals(['A', 'B', 'C']);
    // Unknown tokens
    o(getModuleListFromQuery({ m: 'Halló,Jón' })).deepEquals(['Halló', 'Jón']);
  });

  o('Ignores missing, or empty m param(s)', () => {
    o(getModuleListFromQuery({})).deepEquals(empty);
    o(getModuleListFromQuery({ m: '' })).deepEquals(empty);
    o(getModuleListFromQuery({ m: ', ,  ,\n, ,\t' })).deepEquals(empty);
    o(getModuleListFromQuery({ m: ['', ''] })).deepEquals(empty);
  });
});
