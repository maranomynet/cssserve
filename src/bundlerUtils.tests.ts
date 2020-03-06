import o from 'ospec';
import {
	lowercaseFirstCompare,
	isSafeToken,
	resolveCssVersionFolder,
	getModuleListFromQuery,
} from './bundlerUtils';

const staticFolder = 'testing/public/';

// ---------------------------------------------------------------------------

o.spec('lowercaseFirstCompare', () => {
	o('sorts alphabetically first, then by case', () => {
		o(['C', 'A', '_B'].sort(lowercaseFirstCompare)).deepEquals(['_B', 'A', 'C']);
		o(['aa', 'ab', 'Ab'].sort(lowercaseFirstCompare)).deepEquals(['aa', 'Ab', 'ab']);
		o(['B', 'a', 'c', 'D'].sort(lowercaseFirstCompare)).deepEquals(['a', 'B', 'c', 'D']);
	});
});

// ---------------------------------------------------------------------------

o.spec('iSafeToken', () => {
	o('Accepts simple tokens', () => {
		o(isSafeToken('hello')).equals(true);
		o(isSafeToken('1.1')).equals(true);
		o(isSafeToken('foo-bar')).equals(true);
		o(isSafeToken('foo_bar')).equals(true);
	});
	o('rejects evil tokens', () => {
		o(isSafeToken('foo/bar')).equals(false);
		o(isSafeToken('foo/../bar')).equals(false);
		o(isSafeToken('..')).equals(false);
	});
	o('accepts undefined/empty tokens', () => {
		o(isSafeToken('')).equals(true);
		o(isSafeToken(undefined)).equals(true);
	});
});

// ---------------------------------------------------------------------------

o.spec('resolveCssVersionFolder', () => {
	o('finds exact folderNames', () => {
		o(resolveCssVersionFolder('dev', staticFolder)).equals('css/dev/');
		o(resolveCssVersionFolder('v1.1', staticFolder)).equals('css/v1.1/');
	});
	o('finds highest point-version folder', () => {
		o(resolveCssVersionFolder('v1', staticFolder)).equals('css/v1.10/');
		o(resolveCssVersionFolder('v15', staticFolder)).equals('css/v15.1/');
	});
	o('returns `null` for undefined version', () => {
		o(resolveCssVersionFolder(undefined, staticFolder)).equals(null);
	});
	o('returns `null` for bonkers versions', () => {
		o(resolveCssVersionFolder('bonkers', staticFolder)).equals(null);
	});
	o('returns `null` for evil versions', () => {
		o(resolveCssVersionFolder('../css/dev', staticFolder)).equals(null);
	});
});

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
