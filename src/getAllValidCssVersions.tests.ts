import o from 'ospec';
import { staticFolder } from '../testing/cssserver-config.json';
import getAllValidCssVersions from './getAllValidCssVersions';

// ---------------------------------------------------------------------------

o.spec('getAllValidCssVersions', () => {
	o('works', () => {
		o(getAllValidCssVersions(staticFolder)).deepEquals({
			dev: 'css/dev/',
			v1: 'css/v1.10.10/',
			'v1.1': 'css/v1.1/',
			'v1.2': 'css/v1.2/',
			'v1.10': 'css/v1.10.10/',
			'v1.10.10': 'css/v1.10.10/',
			'v1.10.nan': 'css/v1.10.nan/',
			v15: 'css/v15.1/',
			'v15.0': 'css/v15.0/',
			'v15.1': 'css/v15.1/',
		});
	});
});
