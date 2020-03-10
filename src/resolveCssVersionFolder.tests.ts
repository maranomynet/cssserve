import o from 'ospec';
import { staticFolder } from '../testing/cssserver-config.json';
import resolveCssVersionFolder from './resolveCssVersionFolder';

// ---------------------------------------------------------------------------

o.spec('resolveCssVersionFolder', () => {
	o('finds exact folderNames', () => {
		o(resolveCssVersionFolder(staticFolder, 'dev')).equals('css/dev/');
		o(resolveCssVersionFolder(staticFolder, 'v1.1')).equals('css/v1.1/');
	});
	o('finds highest point-version folder', () => {
		o(resolveCssVersionFolder(staticFolder, 'v1')).equals('css/v1.10.10/');
		o(resolveCssVersionFolder(staticFolder, 'v1.10')).equals('css/v1.10.10/');
		o(resolveCssVersionFolder(staticFolder, 'v15')).equals('css/v15.1/');
	});
	o('returns `null` for undefined version', () => {
		o(resolveCssVersionFolder(staticFolder, undefined)).equals(null);
	});
	o('returns `null` for bonkers versions', () => {
		o(resolveCssVersionFolder(staticFolder, 'bonkers')).equals(null);
	});
	o('returns `null` for evil versions', () => {
		o(resolveCssVersionFolder(staticFolder, '../css/dev')).equals(null);
	});
});
