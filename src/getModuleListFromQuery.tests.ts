import o from 'ospec';
import getModuleListFromQuery from './getModuleListFromQuery';

// ---------------------------------------------------------------------------

o.spec('getModuleListFromQuery', () => {
	const empty: Array<string> = [];
	o('finds the m param and splits it on commas, and sorts the list', () => {
		o(getModuleListFromQuery({ m: 'Module' })).deepEquals(['Module']);
		o(getModuleListFromQuery({ m: 'A,B,C' })).deepEquals(['A', 'B', 'C']);
		o(getModuleListFromQuery({ m: 'C,_B,A' })).deepEquals(['_B', 'A', 'C']);
	});
	o('Rejects m params with spaces or invalid tokens', () => {
		o(getModuleListFromQuery({ m: '../A' })).deepEquals(empty);
		o(getModuleListFromQuery({ m: 'A ,B, C' })).deepEquals(empty);
		o(getModuleListFromQuery({ m: 'Halló,Jón' })).deepEquals(empty);
	});
	o('Ignores missing, or empty m param(s)', () => {
		o(getModuleListFromQuery({})).deepEquals(empty);
		o(getModuleListFromQuery({ m: '' })).deepEquals(empty);
		o(getModuleListFromQuery({ m: ['', ''] })).deepEquals(empty);
	});
});
